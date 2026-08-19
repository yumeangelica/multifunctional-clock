(() => {
  'use strict';

  /** @typedef {'real-time-clock' | 'stopwatch' | 'countdown-timer'} ClockMode */
  /** @typedef {'idle' | 'running' | 'paused' | 'finished'} TimerState */
  /** @typedef {{ totalMs: number, splitMs: number }} Lap */

  /** @type {Readonly<Record<string, string>>} */
  const SPECIAL_GREETINGS = {
    '00:00': "It's midnight!",
    '01:11': 'Angel numbers ♡',
    '02:22': 'Angel numbers ♡',
    '03:33': 'Angel numbers ♡',
    '04:03': 'The clock is forbidden!',
    '04:04': 'Clock is not found.',
    '04:20': "It's a global Amsterdam time…",
    '04:44': 'Angel numbers ♡',
    '05:55': 'Angel numbers ♡',
    '11:11': 'Angel numbers ♡',
    '12:12': 'Angel numbers ♡',
    '13:13': 'Angel numbers ♡',
    '14:14': 'Angel numbers ♡',
    '15:15': 'Angel numbers ♡',
    '16:16': 'Angel numbers ♡',
    '17:17': 'Angel numbers ♡',
    '18:18': 'Angel numbers ♡',
    '19:19': 'Angel numbers ♡',
    '20:20': 'Angel numbers ♡',
    '21:21': 'Angel numbers ♡',
    '22:22': 'Angel numbers ♡',
    '23:23': 'Angel numbers ♡',
  };

  const createClockFormatters = () => {
    const date = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeZone = date.resolvedOptions().timeZone;

    return {
      date,
      time12Hour: new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone,
      }),
      time24Hour: new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        timeZone,
      }),
      timeZone,
    };
  };

  let clockFormatters = createClockFormatters();

  const refreshClockFormatters = () => {
    const currentTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (currentTimeZone !== clockFormatters.timeZone) clockFormatters = createClockFormatters();
  };

  const elements = {
    modeButtons: /** @type {HTMLButtonElement[]} */ ([...document.querySelectorAll('[data-mode]')]),
    panels: /** @type {HTMLElement[]} */ ([...document.querySelectorAll('.tool-panel')]),
    formatButton: /** @type {HTMLButtonElement} */ (document.getElementById('clock-format-button')),
    currentDate: /** @type {HTMLTimeElement} */ (document.getElementById('current-date')),
    currentTime: /** @type {HTMLTimeElement} */ (document.getElementById('current-time')),
    greeting: /** @type {HTMLParagraphElement} */ (document.getElementById('greeting-message')),
    stopwatchDisplay: /** @type {HTMLOutputElement} */ (document.getElementById('stopwatch-display')),
    stopwatchStart: /** @type {HTMLButtonElement} */ (document.getElementById('stopwatch-start')),
    stopwatchLap: /** @type {HTMLButtonElement} */ (document.getElementById('stopwatch-lap')),
    stopwatchPause: /** @type {HTMLButtonElement} */ (document.getElementById('stopwatch-pause')),
    stopwatchReset: /** @type {HTMLButtonElement} */ (document.getElementById('stopwatch-reset')),
    laps: /** @type {HTMLDivElement} */ (document.getElementById('laps')),
    lapList: /** @type {HTMLOListElement} */ (document.getElementById('lap-list')),
    presets: /** @type {HTMLButtonElement[]} */ ([...document.querySelectorAll('.preset-button')]),
    spinnerButtons: /** @type {HTMLButtonElement[]} */ ([...document.querySelectorAll('[data-adjust]')]),
    timerMinutes: /** @type {HTMLInputElement} */ (document.getElementById('timer-minutes')),
    timerSeconds: /** @type {HTMLInputElement} */ (document.getElementById('timer-seconds')),
    timerPreview: /** @type {HTMLOutputElement} */ (document.getElementById('timer-preview')),
    countdownDisplay: /** @type {HTMLOutputElement} */ (document.getElementById('countdown-display')),
    timerStart: /** @type {HTMLButtonElement} */ (document.getElementById('timer-start')),
    timerPause: /** @type {HTMLButtonElement} */ (document.getElementById('timer-pause')),
    timerClear: /** @type {HTMLButtonElement} */ (document.getElementById('timer-clear')),
    timerAlert: /** @type {HTMLParagraphElement} */ (document.getElementById('timer-alert')),
    status: /** @type {HTMLParagraphElement} */ (document.getElementById('app-status')),
  };

  /** @type {ClockMode} */
  let activeMode = 'real-time-clock';
  let is12HourTime = true;
  /** @type {number | null} */
  let clockTimeout = null;
  /** @type {AudioContext | null} */
  let audioContext = null;
  /** @type {number | null} */
  let statusTimeout = null;

  /** @type {{ running: boolean, startedAt: number, elapsedMs: number, frame: number | null, laps: Lap[] }} */
  const stopwatch = {
    running: false,
    startedAt: 0,
    elapsedMs: 0,
    frame: null,
    laps: [],
  };

  /** @type {{ state: TimerState, endAt: number, remainingMs: number, timeout: number | null }} */
  const timer = {
    state: 'idle',
    endAt: 0,
    remainingMs: 0,
    timeout: null,
  };

  const setStatus = (message = '') => {
    if (statusTimeout !== null) window.clearTimeout(statusTimeout);
    elements.status.textContent = '';
    statusTimeout = window.setTimeout(() => {
      elements.status.textContent = message;
    }, 10);
  };

  /**
   * @param {Date} date
   * @returns {string}
   */
  const getGreeting = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const special = SPECIAL_GREETINGS[`${hours}:${minutes}`];
    if (special) return special;

    const hour = date.getHours();
    if (hour < 5) return 'Good Night!';
    if (hour < 11) return 'Good Morning!';
    if (hour < 17) return 'Good Day!';
    return 'Good Evening!';
  };

  const updateClock = () => {
    if (clockTimeout !== null) window.clearTimeout(clockTimeout);
    const nowMs = Date.now();
    const now = new Date(nowMs);
    const timeFormatter = is12HourTime ? clockFormatters.time12Hour : clockFormatters.time24Hour;
    const timeText = timeFormatter.format(now);
    const dateText = clockFormatters.date.format(now);
    const localDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    const localTime = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join(':');

    elements.currentDate.dateTime = localDate;
    elements.currentDate.textContent = dateText;
    elements.currentTime.dateTime = localTime;
    elements.currentTime.textContent = timeText;
    elements.greeting.textContent = getGreeting(now);

    const delayToNextSecond = 1010 - (nowMs % 1000);
    clockTimeout = window.setTimeout(updateClock, delayToNextSecond);
  };

  const toggleClockFormat = () => {
    is12HourTime = !is12HourTime;
    elements.formatButton.setAttribute('aria-pressed', String(!is12HourTime));
    updateClock();
    setStatus(`${is12HourTime ? '12-hour' : '24-hour'} time format selected.`);
  };

  /** @param {HTMLButtonElement | null} [selectedButton] */
  const setActivePreset = (selectedButton = null) => {
    elements.presets.forEach((button) => {
      button.setAttribute('aria-pressed', String(button === selectedButton));
    });
  };

  /** @param {ClockMode} mode */
  const switchMode = (mode) => {
    activeMode = mode;
    elements.modeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
    elements.panels.forEach((panel) => {
      panel.hidden = panel.id !== mode;
    });

    const selectedButton = /** @type {HTMLButtonElement} */ (
      elements.modeButtons.find((button) => button.dataset.mode === mode)
    );
    setStatus(`${selectedButton.textContent.trim()} selected.`);
  };

  /**
   * @param {number} milliseconds
   * @param {boolean} [showMilliseconds]
   * @returns {string}
   */
  const formatDuration = (milliseconds, showMilliseconds = true) => {
    const safeMs = Math.max(0, Math.floor(milliseconds));
    const hours = Math.floor(safeMs / 3_600_000);
    const minutes = Math.floor((safeMs % 3_600_000) / 60_000);
    const seconds = Math.floor((safeMs % 60_000) / 1000);
    const millis = safeMs % 1000;
    const base = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
    return showMilliseconds ? `${base}.${String(millis).padStart(3, '0')}` : base;
  };

  const getStopwatchElapsed = () => stopwatch.running
    ? performance.now() - stopwatch.startedAt
    : stopwatch.elapsedMs;

  const renderStopwatch = () => {
    elements.stopwatchDisplay.value = formatDuration(getStopwatchElapsed());
    elements.stopwatchDisplay.textContent = elements.stopwatchDisplay.value;
  };

  const syncStopwatchControls = () => {
    const hasElapsed = getStopwatchElapsed() > 0;
    elements.stopwatchStart.disabled = stopwatch.running;
    elements.stopwatchStart.textContent = hasElapsed && !stopwatch.running ? 'Resume' : 'Start';
    elements.stopwatchLap.disabled = !stopwatch.running;
    elements.stopwatchPause.disabled = !stopwatch.running;
    elements.stopwatchReset.disabled = !hasElapsed && stopwatch.laps.length === 0;
  };

  const stopwatchTick = () => {
    if (!stopwatch.running) return;
    renderStopwatch();
    stopwatch.frame = requestAnimationFrame(stopwatchTick);
  };

  const startStopwatch = () => {
    if (stopwatch.running) return;
    stopwatch.startedAt = performance.now() - stopwatch.elapsedMs;
    stopwatch.running = true;
    syncStopwatchControls();
    stopwatchTick();
    setStatus(stopwatch.elapsedMs > 0 ? 'Stopwatch resumed.' : 'Stopwatch started.');
  };

  const pauseStopwatch = () => {
    if (!stopwatch.running) return;
    stopwatch.elapsedMs = performance.now() - stopwatch.startedAt;
    stopwatch.running = false;
    if (stopwatch.frame !== null) cancelAnimationFrame(stopwatch.frame);
    stopwatch.frame = null;
    renderStopwatch();
    syncStopwatchControls();
    setStatus(`Stopwatch paused at ${formatDuration(stopwatch.elapsedMs)}.`);
  };

  const recordLap = () => {
    if (!stopwatch.running) return;
    const totalMs = getStopwatchElapsed();
    const previousTotal = stopwatch.laps.at(-1)?.totalMs ?? 0;
    const lap = { totalMs, splitMs: totalMs - previousTotal };
    stopwatch.laps.push(lap);

    const item = document.createElement('li');
    const entry = document.createElement('div');
    const label = document.createElement('strong');
    const value = document.createElement('time');
    entry.className = 'lap-entry';
    label.textContent = `Lap ${stopwatch.laps.length}`;
    value.textContent = `${formatDuration(lap.splitMs)} split · ${formatDuration(lap.totalMs)} total`;
    entry.append(label, value);
    item.appendChild(entry);
    elements.lapList.appendChild(item);
    elements.laps.hidden = false;
    elements.lapList.scrollTop = elements.lapList.scrollHeight;
    syncStopwatchControls();
    setStatus(`Lap ${stopwatch.laps.length} recorded at ${formatDuration(lap.totalMs)}.`);
  };

  const resetStopwatch = () => {
    if (stopwatch.running) pauseStopwatch();
    stopwatch.elapsedMs = 0;
    stopwatch.startedAt = 0;
    stopwatch.laps = [];
    elements.lapList.replaceChildren();
    elements.laps.hidden = true;
    renderStopwatch();
    syncStopwatchControls();
    setStatus('Stopwatch reset.');
  };

  /** @param {HTMLInputElement} input */
  const clampTimerInput = (input) => {
    const parsed = Number.parseInt(input.value, 10);
    const value = Number.isFinite(parsed) ? parsed : 0;
    return Math.min(59, Math.max(0, value));
  };

  const getSelectedDuration = () => (
    (clampTimerInput(elements.timerMinutes) * 60) + clampTimerInput(elements.timerSeconds)
  ) * 1000;

  /** @param {number} milliseconds */
  const formatCountdown = (milliseconds) => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  /** @param {number} remainingMs */
  const getNextTimerDelay = (remainingMs) => {
    const delayToNextSecond = remainingMs % 1000 || 1000;
    return Math.min(remainingMs, delayToNextSecond);
  };

  const renderTimerPreview = () => {
    elements.timerPreview.value = formatCountdown(getSelectedDuration());
    elements.timerPreview.textContent = elements.timerPreview.value;
  };

  const renderCountdown = () => {
    elements.countdownDisplay.value = formatCountdown(timer.remainingMs);
    elements.countdownDisplay.textContent = elements.countdownDisplay.value;
  };

  const syncTimerControls = () => {
    const isRunning = timer.state === 'running';
    const isPaused = timer.state === 'paused';
    const inputsLocked = isRunning || isPaused;
    const hasSelectedDuration = getSelectedDuration() > 0;
    const durationControls = [
      ...elements.presets,
      ...elements.spinnerButtons,
      elements.timerMinutes,
      elements.timerSeconds,
    ];

    durationControls.forEach((control) => {
      control.disabled = inputsLocked;
    });

    elements.timerStart.textContent = isPaused ? 'Resume' : 'Start';
    elements.timerStart.disabled = isRunning || (!isPaused && !hasSelectedDuration);
    elements.timerPause.disabled = !isRunning;
    elements.timerClear.disabled = timer.state === 'idle' && !hasSelectedDuration;
  };

  const clearTimerTick = () => {
    if (timer.timeout !== null) {
      window.clearTimeout(timer.timeout);
      timer.timeout = null;
    }
  };

  const ensureAudioContext = () => {
    const AudioContextClass = window.AudioContext || /** @type {Window & typeof globalThis & {
      webkitAudioContext?: typeof AudioContext
    }} */ (window).webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ??= new AudioContextClass();
    if (audioContext.state === 'suspended') void audioContext.resume();
  };

  const playNotification = () => {
    const context = audioContext;
    if (!context) return;
    void context.resume().then(() => {
      const startAt = context.currentTime;
      [659, 784, 988].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const toneStart = startAt + (index * 0.18);
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, toneStart);
        gain.gain.exponentialRampToValueAtTime(0.2, toneStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + 0.16);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(toneStart);
        oscillator.stop(toneStart + 0.17);
      });
    });
  };

  const finishTimer = () => {
    clearTimerTick();
    timer.state = 'finished';
    timer.remainingMs = 0;
    renderCountdown();
    syncTimerControls();
    elements.timerAlert.textContent = 'Time is up!';
    playNotification();
  };

  const timerTick = () => {
    timer.remainingMs = Math.max(0, timer.endAt - Date.now());
    renderCountdown();

    if (timer.remainingMs <= 0) {
      finishTimer();
      return;
    }

    timer.timeout = window.setTimeout(timerTick, getNextTimerDelay(timer.remainingMs));
  };

  const startTimer = () => {
    const wasPaused = timer.state === 'paused';
    const duration = wasPaused ? timer.remainingMs : getSelectedDuration();
    if (duration <= 0) {
      elements.timerAlert.textContent = 'Set a duration before starting the timer.';
      return;
    }

    ensureAudioContext();
    elements.timerAlert.textContent = '';
    timer.remainingMs = duration;
    timer.endAt = Date.now() + duration;
    timer.state = 'running';
    renderCountdown();
    syncTimerControls();
    timerTick();
    setStatus(`Countdown ${wasPaused ? 'resumed' : 'started'} for ${formatCountdown(duration)}.`);
  };

  const pauseTimer = () => {
    if (timer.state !== 'running') return;
    timer.remainingMs = Math.max(0, timer.endAt - Date.now());
    clearTimerTick();

    if (timer.remainingMs <= 0) {
      finishTimer();
      return;
    }

    timer.state = 'paused';
    renderCountdown();
    syncTimerControls();
    setStatus(`Countdown paused at ${formatCountdown(timer.remainingMs)}.`);
  };

  const clearTimer = () => {
    clearTimerTick();
    timer.state = 'idle';
    timer.endAt = 0;
    timer.remainingMs = 0;
    elements.timerMinutes.value = '0';
    elements.timerSeconds.value = '0';
    setActivePreset();
    elements.timerAlert.textContent = '';
    renderTimerPreview();
    renderCountdown();
    syncTimerControls();
    setStatus('Countdown cleared.');
  };

  const updateDurationFromInputs = () => {
    if (timer.state === 'finished') timer.state = 'idle';
    elements.timerAlert.textContent = '';
    renderTimerPreview();
    timer.remainingMs = getSelectedDuration();
    renderCountdown();
    syncTimerControls();
  };

  /** @param {HTMLInputElement} input */
  const normalizeDurationInput = (input) => {
    input.value = String(clampTimerInput(input));
    updateDurationFromInputs();
  };

  elements.modeButtons.forEach((button) => {
    button.addEventListener('click', () => switchMode(/** @type {ClockMode} */ (button.dataset.mode)));
  });
  elements.formatButton.addEventListener('click', toggleClockFormat);
  elements.stopwatchStart.addEventListener('click', startStopwatch);
  elements.stopwatchLap.addEventListener('click', recordLap);
  elements.stopwatchPause.addEventListener('click', pauseStopwatch);
  elements.stopwatchReset.addEventListener('click', resetStopwatch);

  elements.presets.forEach((button) => {
    button.addEventListener('click', () => {
      elements.timerMinutes.value = /** @type {string} */ (button.dataset.minutes);
      elements.timerSeconds.value = /** @type {string} */ (button.dataset.seconds);
      updateDurationFromInputs();
      setActivePreset(button);
      setStatus(`${button.textContent.trim()} countdown selected.`);
    });
  });

  elements.spinnerButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.dataset.adjust === 'minutes' ? elements.timerMinutes : elements.timerSeconds;
      input.value = String(Math.min(59, Math.max(0, clampTimerInput(input) + Number(button.dataset.change))));
      setActivePreset();
      updateDurationFromInputs();
    });
  });

  [elements.timerMinutes, elements.timerSeconds].forEach((input) => {
    input.addEventListener('input', () => {
      setActivePreset();
      updateDurationFromInputs();
    });
    input.addEventListener('blur', () => normalizeDurationInput(input));
  });

  elements.timerStart.addEventListener('click', startTimer);
  elements.timerPause.addEventListener('click', pauseTimer);
  elements.timerClear.addEventListener('click', clearTimer);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    refreshClockFormatters();
    updateClock();
    if (timer.state !== 'running') return;
    clearTimerTick();
    timerTick();
  });

  document.addEventListener('keydown', (event) => {
    const isInteractiveTarget = event.target instanceof Element
      ? event.target.closest('button, input, a, summary')
      : null;

    if (event.key === 'Escape') {
      if (activeMode === 'stopwatch' && stopwatch.running) pauseStopwatch();
      if (activeMode === 'countdown-timer' && timer.state === 'running') pauseTimer();
      return;
    }

    if (event.key !== ' ' || isInteractiveTarget) return;

    if (activeMode === 'stopwatch') {
      event.preventDefault();
      stopwatch.running ? pauseStopwatch() : startStopwatch();
    }

    if (activeMode === 'countdown-timer') {
      event.preventDefault();
      timer.state === 'running' ? pauseTimer() : startTimer();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (clockTimeout !== null) window.clearTimeout(clockTimeout);
    if (statusTimeout !== null) window.clearTimeout(statusTimeout);
    clearTimerTick();
    if (stopwatch.frame !== null) cancelAnimationFrame(stopwatch.frame);
    if (audioContext && audioContext.state !== 'closed') void audioContext.close();
  });

  updateClock();
  renderStopwatch();
  syncStopwatchControls();
  renderTimerPreview();
  renderCountdown();
  syncTimerControls();
})();
