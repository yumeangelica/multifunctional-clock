// ============================================================================
// GLOBAL VARIABLES AND STATE
// ============================================================================

/**
 * Clock format state - true for 12-hour, false for 24-hour
 * @type {boolean}
 */
let is12HourFormat = true;

/**
 * Countdown timer interval ID for clearing the timer
 * @type {number|null}
 */
let countdownIntervalId = null;

/**
 * Remaining time in seconds when timer is paused
 * @type {number}
 */
let pausedTimeRemaining = 0;

/**
 * ARIA live region for screen reader announcements
 * @type {HTMLElement|null}
 */
let ariaLiveRegion = null;

/**
 * Stopwatch data object containing timing information and lap times
 * @type {Object}
 * @property {Array} lapTimes - Array of recorded lap times
 * @property {number} animationFrameId - ID of the animation frame for updates
 * @property {number} currentTime - Current performance time
 * @property {number} elapsedTime - Total elapsed time in milliseconds
 * @property {number} startTime - Start time for the current session
 */
let stopwatchData = {
  lapTimes: [],
  animationFrameId: 0,
  currentTime: 0,
  elapsedTime: 0,
  startTime: 0
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Populate the clock mode dropdown with options from the constants
 * Creates option elements dynamically and adds them to the select element
 */
const populateClockModeDropdown = () => {
  const functionSelector = document.getElementById('function-selector');

  // Clear existing options
  functionSelector.innerHTML = '';

  // Add each option from the constants
  CLOCK_MODE_OPTIONS.forEach(optionConfig => {
    const option = document.createElement('option');
    option.value = optionConfig.value;
    option.textContent = optionConfig.text;

    if (optionConfig.disabled) {
      option.disabled = true;
    }

    if (optionConfig.selected) {
      option.selected = true;
    }

    functionSelector.appendChild(option);
  });
};

/**
 * Populate the timer preset buttons from the constants
 * Creates button elements dynamically and adds them to the preset buttons container
 */
const populateTimerPresetButtons = () => {
  const presetButtonsContainer = document.querySelector('.preset-buttons');

  // Clear existing buttons
  presetButtonsContainer.innerHTML = '';

  // Add each preset button from the constants
  TIMER_PRESET_BUTTONS.forEach(preset => {
    const button = document.createElement('button');
    button.className = 'preset-btn';
    button.textContent = preset.label;
    button.setAttribute('aria-label', preset.ariaLabel);

    // Add click event listener
    button.addEventListener('click', () => {
      setTimerPreset(preset.minutes, preset.seconds);
    });

    presetButtonsContainer.appendChild(button);
  });
};

/**
 * Populate the spinner buttons for timer inputs
 * Creates spinner button elements dynamically and adds them to their containers
 */
const populateSpinnerButtons = () => {
  // Get the spinner containers
  const minutesSpinner = document.querySelector('.time-spinner:first-child .spinner-container');
  const secondsSpinner = document.querySelector('.time-spinner:last-child .spinner-container');

  // Clear existing buttons and keep only the input
  const minutesInput = minutesSpinner.querySelector('#timer-minutes');
  const secondsInput = secondsSpinner.querySelector('#timer-seconds');

  minutesSpinner.innerHTML = '';
  secondsSpinner.innerHTML = '';

  // Add minutes spinner buttons
  SPINNER_BUTTONS.filter(btn => btn.type === 'minutes').forEach(config => {
    const button = document.createElement('button');
    button.className = 'spinner-btn';
    button.textContent = config.symbol;
    button.setAttribute('aria-label', config.ariaLabel);
    button.setAttribute('type', 'button');

    button.addEventListener('click', () => {
      adjustTimerValue(config.type, config.adjustment);
    });

    if (config.adjustment === -1) {
      minutesSpinner.appendChild(button);
      minutesSpinner.appendChild(minutesInput);
    } else {
      minutesSpinner.appendChild(button);
    }
  });

  // Add seconds spinner buttons
  SPINNER_BUTTONS.filter(btn => btn.type === 'seconds').forEach(config => {
    const button = document.createElement('button');
    button.className = 'spinner-btn';
    button.textContent = config.symbol;
    button.setAttribute('aria-label', config.ariaLabel);
    button.setAttribute('type', 'button');

    button.addEventListener('click', () => {
      adjustTimerValue(config.type, config.adjustment);
    });

    if (config.adjustment === -1) {
      secondsSpinner.appendChild(button);
      secondsSpinner.appendChild(secondsInput);
    } else {
      secondsSpinner.appendChild(button);
    }
  });
};

/**
 * Populate the timer control buttons
 * Creates button elements dynamically and adds them to the timer controls container
 */
const populateTimerControlButtons = () => {
  const timerControlsContainer = document.querySelector('#countdown-timer .center-container');

  // Clear existing buttons
  timerControlsContainer.innerHTML = '';

  // Add each timer control button
  TIMER_CONTROL_BUTTONS.forEach(config => {
    const button = document.createElement('button');
    button.className = 'button';
    button.id = config.id;
    button.textContent = config.text;
    button.setAttribute('aria-label', config.ariaLabel);
    button.setAttribute('aria-describedby', 'timer-help');

    // Set disabled state if specified
    if (config.disabled) {
      button.disabled = true;
    }

    // Add click event listener based on the function name
    switch (config.id) {
      case 'timer-start-button':
        button.addEventListener('click', startCountdownTimer);
        break;
      case 'timer-stop-button':
        button.addEventListener('click', stopCountdownTimer);
        break;
      case 'timer-clear-button':
        button.addEventListener('click', clearTimerInputs);
        break;
    }

    timerControlsContainer.appendChild(button);
  });
};

/**
 * Populate the stopwatch control buttons
 * Creates button elements dynamically and adds them to the stopwatch controls container
 */
const populateStopwatchControlButtons = () => {
  const stopwatchControlsContainer = document.querySelector('#stopwatch .button-container');

  // Clear existing buttons
  stopwatchControlsContainer.innerHTML = '';

  // Add each stopwatch control button
  STOPWATCH_CONTROL_BUTTONS.forEach(config => {
    const button = document.createElement('button');
    button.className = 'button';
    button.id = config.id;
    button.textContent = config.text;
    button.setAttribute('aria-label', config.ariaLabel);
    button.setAttribute('aria-describedby', 'stopwatch-help');

    if (config.disabled) {
      button.disabled = true;
    }

    // Add click event listeners based on button ID
    switch (config.id) {
      case 'start-button':
        button.addEventListener('click', () => {
          const startBtn = document.getElementById('start-button');
          const lapBtn = document.getElementById('lap-button');
          const stopBtn = document.getElementById('stop-button');
          const clearBtn = document.getElementById('clear-button');

          startBtn.disabled = true;
          lapBtn.disabled = false;
          stopBtn.disabled = false;
          clearBtn.disabled = true;
          startStopwatch();
          announceToScreenReader('Stopwatch started');
        });
        break;

      case 'lap-button':
        button.addEventListener('click', () => {
          recordLapTime();
          const newLapElement = document.createElement('li');
          const lastLapTime = stopwatchData.lapTimes[stopwatchData.lapTimes.length - 1];
          const lapTimeText = `${lastLapTime.hours}:${lastLapTime.minutes}´${lastLapTime.seconds}´´${lastLapTime.milliseconds}`;
          newLapElement.textContent = lapTimeText;
          newLapElement.setAttribute('aria-label', `Lap time ${stopwatchData.lapTimes.length}: ${lapTimeText}`);
          document.getElementById('lap-time-list').appendChild(newLapElement);
          announceToScreenReader(`Lap time recorded: ${lapTimeText}`);
        });
        break;

      case 'stop-button':
        button.addEventListener('click', () => {
          const startBtn = document.getElementById('start-button');
          const lapBtn = document.getElementById('lap-button');
          const stopBtn = document.getElementById('stop-button');
          const clearBtn = document.getElementById('clear-button');

          startBtn.disabled = false;
          lapBtn.disabled = true;
          stopBtn.disabled = true;
          clearBtn.disabled = false;
          startBtn.textContent = 'Resume';
          cancelAnimationFrame(stopwatchData.animationFrameId);
          announceToScreenReader('Stopwatch stopped');
          startBtn.focus();
        });
        break;

      case 'clear-button':
        button.addEventListener('click', () => {
          const startBtn = document.getElementById('start-button');
          const lapBtn = document.getElementById('lap-button');
          const stopBtn = document.getElementById('stop-button');
          const clearBtn = document.getElementById('clear-button');

          startBtn.disabled = false;
          lapBtn.disabled = true;
          stopBtn.disabled = true;
          clearBtn.disabled = true;
          startBtn.textContent = 'Start';
          clearStopwatch();
          announceToScreenReader('Stopwatch cleared and reset');
          startBtn.focus();
        });
        break;
    }

    stopwatchControlsContainer.appendChild(button);
  });
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Special time greetings for specific times
 * @type {Object<string, string>}
 */
const SPECIAL_TIME_GREETINGS = {
  '00:00': "It's midnight!",
  '01:11': 'Angel numbers<3',
  '02:22': 'Angel numbers<3',
  '03:33': 'Angel numbers<3',
  '04:03': 'The clock is forbidden!',
  '04:04': 'Clock is not found.',
  '04:20': "It's a global Amsterdam time...",
  '04:44': 'Angel numbers<3',
  '05:55': 'Angel numbers<3',
  '11:11': 'Angel numbers<3',
  '12:12': 'Angel numbers<3',
  '13:13': 'Angel numbers<3',
  '14:14': 'Angel numbers<3',
  '15:15': 'Angel numbers<3',
  '16:16': 'Angel numbers<3',
  '17:17': 'Angel numbers<3',
  '18:18': 'Angel numbers<3',
  '19:19': 'Angel numbers<3',
  '20:20': 'Angel numbers<3',
  '21:21': 'Angel numbers<3',
  '22:22': 'Angel numbers<3',
  '23:23': 'Angel numbers<3'
};

/**
 * Default time-based greetings
 * @type {Array<{range: number[], message: string}>}
 */
const DEFAULT_TIME_GREETINGS = [
  { range: [0, 5], message: 'Good Night!' },
  { range: [5, 11], message: 'Good Morning!' },
  { range: [11, 17], message: 'Good Day!' },
  { range: [17, 23], message: 'Good Evening!' }
];

/**
 * Clock mode options for the dropdown selector
 * @type {Array<{value: string, text: string, selected?: boolean}>}
 */
const CLOCK_MODE_OPTIONS = [
  { value: '', text: 'Select clock functionality', disabled: true },
  { value: 'real-time-clock', text: 'Real-time Clock', selected: true },
  { value: 'stopwatch', text: 'Stopwatch' },
  { value: 'countdown-timer', text: 'Countdown Timer' }
];

/**
 * Timer preset button configurations
 * @type {Array<{minutes: number, seconds: number, label: string, ariaLabel: string}>}
 */
const TIMER_PRESET_BUTTONS = [
  { minutes: 5, seconds: 0, label: '5 min', ariaLabel: 'Set timer to 5 minutes' },
  { minutes: 10, seconds: 0, label: '10 min', ariaLabel: 'Set timer to 10 minutes' },
  { minutes: 15, seconds: 0, label: '15 min', ariaLabel: 'Set timer to 15 minutes' },
  { minutes: 30, seconds: 0, label: '30 min', ariaLabel: 'Set timer to 30 minutes' },
  { minutes: 0, seconds: 30, label: '30 sec', ariaLabel: 'Set timer to 30 seconds' }
];

/**
 * Spinner button configurations for timer inputs
 * @type {Array<{id: string, type: string, symbol: string, ariaLabel: string, adjustment: number}>}
 */
const SPINNER_BUTTONS = [
  { id: 'minutes-decrease', type: 'minutes', symbol: '−', ariaLabel: 'Decrease minutes', adjustment: -1 },
  { id: 'minutes-increase', type: 'minutes', symbol: '+', ariaLabel: 'Increase minutes', adjustment: 1 },
  { id: 'seconds-decrease', type: 'seconds', symbol: '−', ariaLabel: 'Decrease seconds', adjustment: -1 },
  { id: 'seconds-increase', type: 'seconds', symbol: '+', ariaLabel: 'Increase seconds', adjustment: 1 }
];

/**
 * Timer control button configurations
 * @type {Array<{id: string, text: string, ariaLabel: string, disabled?: boolean}>}
 */
const TIMER_CONTROL_BUTTONS = [
  { id: 'timer-start-button', text: 'Start', ariaLabel: 'Start countdown timer' },
  { id: 'timer-stop-button', text: 'Stop', ariaLabel: 'Stop countdown timer', disabled: true },
  { id: 'timer-clear-button', text: 'Clear', ariaLabel: 'Clear timer inputs', disabled: true }
];

/**
 * Stopwatch control button configurations
 * @type {Array<{id: string, text: string, ariaLabel: string, disabled?: boolean}>}
 */
const STOPWATCH_CONTROL_BUTTONS = [
  { id: 'start-button', text: 'Start', ariaLabel: 'Start stopwatch' },
  { id: 'lap-button', text: 'Lap', ariaLabel: 'Record lap time', disabled: true },
  { id: 'stop-button', text: 'Stop', ariaLabel: 'Stop stopwatch', disabled: true },
  { id: 'clear-button', text: 'Clear', ariaLabel: 'Clear stopwatch and lap times', disabled: true }
];

// ============================================================================
// CLOCK FUNCTIONALITY
// ============================================================================

/**
 * Toggle between 12-hour and 24-hour clock formats
 * Updates the display format and button text
 */
const toggleClockFormat = () => {
  is12HourFormat = !is12HourFormat;
  const toggleBtn = document.getElementById('clock-format-btn');

  if (is12HourFormat) {
    toggleBtn.textContent = '12H (AM/PM)';
    announceToScreenReader('Switched to 12-hour format with AM/PM');
  } else {
    toggleBtn.textContent = '24H';
    announceToScreenReader('Switched to 24-hour format');
  }

  // Update the display immediately
  updateClockDisplay();
};

/**
 * Format time for display based on current format setting
 * @param {number} hours - Hours value (0-23)
 * @param {string} minutes - Minutes string (already zero-padded)
 * @param {string} seconds - Seconds string (already zero-padded)
 * @returns {string} Formatted time string
 */
const formatTimeForDisplay = (hours, minutes, seconds) => {
  if (is12HourFormat) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const formattedHours = displayHours.toString().padStart(2, '0');
    return `${formattedHours}:${minutes}:${seconds} ${period}`;
  } else {
    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${minutes}:${seconds}`;
  }
};

/**
 * Initialize the application when the DOM is fully loaded
 * Sets up real-time clock, copyright display, timer preview, event listeners, and accessibility features
 */
document.addEventListener('DOMContentLoaded', () => {
  // Populate the clock mode dropdown with options
  populateClockModeDropdown();

  // Populate the timer preset buttons
  populateTimerPresetButtons();

  // Populate the spinner buttons
  populateSpinnerButtons();

  // Populate control buttons
  populateTimerControlButtons();
  populateStopwatchControlButtons();

  // Add event listener for clock mode dropdown
  document.getElementById('function-selector').addEventListener('change', (event) => {
    switchClockMode(event.target.value);
  });

  // Add event listener for clock format toggle button
  document.getElementById('clock-format-btn').addEventListener('click', toggleClockFormat);

  // Initialize the application
  initializeRealTimeClock();
  showCopyRight();
  updateTimerPreview();

  // Add event listeners for manual input changes with validation
  document.getElementById('timer-minutes').addEventListener('change', validateAndUpdateTimer);
  document.getElementById('timer-seconds').addEventListener('change', validateAndUpdateTimer);
  document.getElementById('timer-minutes').addEventListener('blur', validateAndUpdateTimer);
  document.getElementById('timer-seconds').addEventListener('blur', validateAndUpdateTimer);

  // Add input event listeners for live preview updates (without validation)
  document.getElementById('timer-minutes').addEventListener('input', updateTimerPreview);
  document.getElementById('timer-seconds').addEventListener('input', updateTimerPreview);

  // Create permanent live region for better screen reader support
  ariaLiveRegion = createAriaLiveRegion();
});

/**
 * Initialize and start the real-time clock display
 * Updates time, date, and greeting message every second
 */
const initializeRealTimeClock = () => {
  updateClockDisplay();
  setInterval(updateClockDisplay, 1000);
};

/**
 * Updates the clock display with current time, date, and greeting
 * Handles special time greetings and default time-based greetings
 */
const updateClockDisplay = () => {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const year = currentDate.getUTCFullYear();
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  document.getElementById('current-time').textContent = formatTimeForDisplay(parseInt(hours), minutes, seconds);
  document.getElementById('current-date').textContent = `${day}/${month}/${year}`;

  const currentGreeting = SPECIAL_TIME_GREETINGS[`${hours}:${minutes}`] ??
    DEFAULT_TIME_GREETINGS.find(({ range }) => hours >= range[0] && hours < range[1])?.message;

  document.getElementById('greeting-message').textContent = currentGreeting;
};

// ============================================================================
// AUDIO NOTIFICATIONS
// ============================================================================

/**
 * Play a more noticeable and longer audio notification using Web Audio API
 * Plays rapid beeps then a sustained alarm tone with sawtooth waveform
 */
const playNotificationSound = () => {
  if (typeof window.AudioContext === 'undefined' && typeof window.webkitAudioContext === 'undefined') {
    console.warn('Web Audio API is not supported in this browser');
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioCtx();

  /**
   * Play a tone with given settings
   * @param {number} frequency Frequency in Hz
   * @param {string} type Oscillator type (sine, sawtooth, square, triangle)
   * @param {number} start Delay relative to now in seconds
   * @param {number} duration Length of tone in seconds
   */
  const playTone = (frequency, type, start, duration) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.setValueAtTime(frequency, audioContext.currentTime + start);
    osc.type = type;

    gain.gain.setValueAtTime(0, audioContext.currentTime + start);
    gain.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + start + duration);

    osc.start(audioContext.currentTime + start);
    osc.stop(audioContext.currentTime + start + duration);

    osc.onended = () => {
      if (start === finalStart) {
        audioContext.close();
      }
    };
  };

  // Rapid beeps to grab attention
  playTone(1000, 'sine', 0.0, 0.1);
  playTone(1000, 'sine', 0.2, 0.1);
  playTone(1000, 'sine', 0.4, 0.1);
  playTone(1000, 'sine', 0.6, 0.1);
  playTone(1000, 'sine', 0.8, 0.1);

  // Sustained sawtooth alarm
  const finalStart = 1.2;
  playTone(440, 'sawtooth', finalStart, 2.0);
};



// ============================================================================
// TIMER FUNCTIONALITY
// ============================================================================

/**
 * Set timer to a preset value and update the preview
 * @param {number} minutes - Number of minutes to set
 * @param {number} seconds - Number of seconds to set
 */
const setTimerPreset = (minutes, seconds) => {
  const minutesInput = document.getElementById('timer-minutes');
  const secondsInput = document.getElementById('timer-seconds');

  minutesInput.value = minutes;
  secondsInput.value = seconds;
  updateTimerPreview();

  // Announce the preset selection
  announceToScreenReader(`Timer preset selected: ${minutes} minutes and ${seconds} seconds`);
};

/**
 * Adjust timer value by a specified amount
 * @param {string} type - Type of time unit ('minutes' or 'seconds')
 * @param {number} change - Amount to change the value by (positive or negative)
 */
const adjustTimerValue = (type, change) => {
  const input = document.getElementById(`timer-${type}`);
  let currentValue = parseInt(input.value) || 0;
  const maxValue = type === 'minutes' ? 59 : 59;

  currentValue += change;

  if (currentValue < 0) currentValue = 0;
  if (currentValue > maxValue) currentValue = maxValue;

  input.value = currentValue;
  updateTimerPreview();

  // Announce value changes for screen readers
  announceToScreenReader(`${type} set to ${currentValue}`);
};

/**
 * Update the timer preview display with current input values
 * Formats the time as MM:SS and updates the preview element
 */
const updateTimerPreview = () => {
  const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
  const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  document.getElementById('time-preview-display').textContent = `${formattedMinutes}:${formattedSeconds}`;

  // Update timer button states based on input values
  updateTimerButtonStates();
};

/**
 * Update timer control button states based on current input values and timer state
 * Enables start button when time is set, disables stop/clear when timer is not running
 */
const updateTimerButtonStates = () => {
  const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
  const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
  const hasTimeSet = minutes > 0 || seconds > 0;
  const isRunning = countdownIntervalId !== null;
  const isPaused = pausedTimeRemaining > 0 && !isRunning;

  const startButton = document.getElementById('timer-start-button');
  const stopButton = document.getElementById('timer-stop-button');
  const clearButton = document.getElementById('timer-clear-button');

  // Start button should be enabled when time is set and timer is not running
  // Or when timer is paused and can be resumed
  if (startButton) {
    startButton.disabled = (!hasTimeSet && !isPaused) || isRunning;
    startButton.textContent = isPaused ? 'Resume' : 'Start';
    startButton.setAttribute('aria-label', isPaused ? 'Resume countdown timer' : 'Start countdown timer');
  }

  // Stop button should be disabled when timer is not running
  if (stopButton) {
    stopButton.disabled = !isRunning;
  }

  // Clear button should be enabled when there's time set, timer is running, or timer is paused
  if (clearButton) {
    clearButton.disabled = !hasTimeSet && !isRunning && !isPaused;
  }
};

/**
 * Clear timer input fields and reset preview
 * Resets both minutes and seconds inputs to 0 and updates the preview display
 */
const clearTimerInputs = () => {
  const minutesInput = document.getElementById('timer-minutes');
  const secondsInput = document.getElementById('timer-seconds');
  const countdownDisplay = document.getElementById('countdown-display');

  // Stop timer if it's running
  if (countdownIntervalId !== null) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }

  // Clear paused state
  pausedTimeRemaining = 0;

  // Reset display and inputs
  countdownDisplay.textContent = 'Timer';
  countdownDisplay.setAttribute('aria-live', 'polite');
  minutesInput.value = 0;
  secondsInput.value = 0;
  updateTimerPreview();

  // Announce the action to screen readers
  announceToScreenReader('Timer inputs cleared');
};

/**
 * Start the countdown timer with the specified time
 * Validates input, starts the countdown, and manages UI states
 */
const startCountdownTimer = () => {
  const timerStartButton = document.getElementById('timer-start-button');
  const countdownDisplay = document.getElementById('countdown-display');
  const minutesInput = document.getElementById('timer-minutes');
  const secondsInput = document.getElementById('timer-seconds');

  let timeRemainingInSeconds;

  // Check if we're resuming from a paused state
  if (pausedTimeRemaining > 0) {
    timeRemainingInSeconds = pausedTimeRemaining;
    announceToScreenReader('Countdown timer resumed');
  } else {
    // Starting fresh from input values
    const minutesToSeconds = 60 * (parseInt(minutesInput.value) || 0);
    const inputSeconds = parseInt(secondsInput.value) || 0;
    timeRemainingInSeconds = minutesToSeconds + inputSeconds;

    // Check if the input is valid
    if (isNaN(timeRemainingInSeconds) || timeRemainingInSeconds <= 0) {
      handleTimerError('Please enter valid time!');
      return;
    }

    const initialMinutes = Math.floor(timeRemainingInSeconds / 60);
    const initialSeconds = timeRemainingInSeconds % 60;
    announceToScreenReader(`Countdown timer started for ${initialMinutes} minutes and ${initialSeconds} seconds`);
  }

  // Show initial countdown time
  const initialMinutes = Math.floor(timeRemainingInSeconds / 60);
  const initialSeconds = timeRemainingInSeconds % 60;
  const formattedInitialMinutes = initialMinutes.toString().padStart(2, '0');
  const formattedInitialSeconds = initialSeconds.toString().padStart(2, '0');
  countdownDisplay.textContent = `${formattedInitialMinutes}:${formattedInitialSeconds}`;

  // Start the countdown interval
  countdownIntervalId = setInterval(() => {
    timeRemainingInSeconds -= 1;

    if (timeRemainingInSeconds < 0) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null; // Reset the interval ID
      pausedTimeRemaining = 0; // Clear paused state
      countdownDisplay.textContent = 'Finished';
      countdownDisplay.setAttribute('aria-live', 'assertive');

      // Play notification sound
      playNotificationSound();

      // Use a more accessible alert
      announceToScreenReader('Time is over! Countdown timer has finished.');

      // Focus management - return focus to start button and update button states
      updateTimerButtonStates();
      timerStartButton.focus();

      // Reset aria-live back to polite
      setTimeout(() => {
        countdownDisplay.setAttribute('aria-live', 'polite');
      }, 1000);

      // Show browser alert as fallback
      alert('Time is Over!');
    } else {
      // Format remaining time as MM:SS
      const remainingMinutes = Math.floor(timeRemainingInSeconds / 60);
      const remainingSeconds = timeRemainingInSeconds % 60;
      const formattedMinutes = remainingMinutes.toString().padStart(2, '0');
      const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

      countdownDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
    }
  }, 1000);

  // Update button states after setting countdownIntervalId
  updateTimerButtonStates();
};

/**
 * Stop (pause) the countdown timer without resetting inputs
 * Pauses the timer and allows it to be resumed later
 */
const stopCountdownTimer = () => {
  const timerStartButton = document.getElementById('timer-start-button');
  const countdownDisplay = document.getElementById('countdown-display');

  // Only proceed if timer is actually running
  if (countdownIntervalId === null) {
    return;
  }

  // Get the current remaining time from the display
  const currentDisplay = countdownDisplay.textContent;
  if (currentDisplay && currentDisplay.includes(':')) {
    const [minutes, seconds] = currentDisplay.split(':');
    pausedTimeRemaining = parseInt(minutes) * 60 + parseInt(seconds);
  }

  // Stop the interval but don't reset inputs or display
  clearInterval(countdownIntervalId);
  countdownIntervalId = null;

  // Keep the current time displayed (don't reset to "Timer")
  countdownDisplay.setAttribute('aria-live', 'polite');

  announceToScreenReader('Countdown timer paused');

  // Update button states to show Resume button
  updateTimerButtonStates();

  // Focus management - return focus to start button (now shows "Resume")
  timerStartButton.focus();
};


// ============================================================================
// MODE SWITCHING
// ============================================================================

/**
 * Switch between different clock modes (real-time, stopwatch, timer)
 * @param {string} selectedModeId - ID of the selected clock mode
 */
const switchClockMode = (selectedModeId) => {
  // Gets all elements with the class "clock-container"
  const clockModeContainers = document.querySelectorAll('.clock-container');

  // Hides all frames and shows only the selected one
  clockModeContainers.forEach(container => {
    container.style.display = container.id === selectedModeId ? 'block' : 'none';
  });

  // Announce mode change to screen readers
  announceClockMode(selectedModeId);
};

// ============================================================================
// STOPWATCH FUNCTIONALITY
// ============================================================================

/**
 * Start the stopwatch timer and begin updating the display
 * Uses requestAnimationFrame for smooth, accurate timing
 */
const startStopwatch = () => {
  if (typeof stopwatchData.elapsedTime === 'undefined') stopwatchData.elapsedTime = 0;
  stopwatchData.startTime = Math.floor(performance.now() - stopwatchData.elapsedTime);

  /**
   * Update the stopwatch display with current elapsed time
   * Formats time as HH:MM´SS´´MMM and requests next animation frame
   */
  const updateStopwatchDisplay = () => {
    stopwatchData.currentTime = Math.floor(performance.now());
    stopwatchData.elapsedTime = stopwatchData.currentTime - stopwatchData.startTime;

    const elapsedTimeDisplay = document.getElementById('elapsed-time-display');
    elapsedTimeDisplay.textContent = `${timeCalculations.hours()}:${timeCalculations.minutes()}´${timeCalculations.seconds()}´´${timeCalculations.milliseconds()}`;
    stopwatchData.animationFrameId = requestAnimationFrame(updateStopwatchDisplay);
  };

  updateStopwatchDisplay();
};

/**
 * Record a lap time at the current elapsed time
 * Adds the current time to the lap times array
 */
const recordLapTime = () => {
  stopwatchData.lapTimes.push({
    hours: timeCalculations.hours(),
    minutes: timeCalculations.minutes(),
    seconds: timeCalculations.seconds(),
    milliseconds: timeCalculations.milliseconds()
  });
};

/**
 * Clear all stopwatch data and reset the display
 * Resets timing data, clears lap times, and updates UI
 */
const clearStopwatch = () => {
  stopwatchData.startTime = 0;
  stopwatchData.currentTime = 0;
  stopwatchData.elapsedTime = 0;
  stopwatchData.lapTimes = [];
  stopwatchData.animationFrameId = 0;

  const elapsedTimeDisplay = document.getElementById('elapsed-time-display');
  const lapTimesList = document.getElementById('lap-time-list');

  elapsedTimeDisplay.textContent = '00:00´00´´000';
  lapTimesList.textContent = '';
};

/**
 * Time calculation utilities for formatting elapsed time
 * @type {Object}
 */
const timeCalculations = {
  /** @returns {string} Formatted hours with zero padding */
  hours() { return formatTimeWithZeroPadding(Math.floor(stopwatchData.elapsedTime / 1000 / 60 / 60)); },
  /** @returns {string} Formatted minutes with zero padding */
  minutes() { return formatTimeWithZeroPadding(Math.floor(stopwatchData.elapsedTime / 1000 / 60) % 60); },
  /** @returns {string} Formatted seconds with zero padding */
  seconds() { return formatTimeWithZeroPadding(Math.floor(stopwatchData.elapsedTime / 1000) % 60); },
  /** @returns {string} Formatted milliseconds with zero padding */
  milliseconds() { return formatTimeWithZeroPadding(Math.floor(stopwatchData.elapsedTime % 1000), 3); }
};

/**
 * Format a time value with zero padding
 * @param {number} value - The time value to format
 * @param {number} [minimumDigits=2] - Minimum number of digits to display
 * @returns {string} Formatted time string with zero padding
 */
const formatTimeWithZeroPadding = (value, minimumDigits = 2) => value.toString().padStart(minimumDigits, '0');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a permanent ARIA live region for screen reader announcements
 * @returns {HTMLElement} The created live region element
 */
const createAriaLiveRegion = () => {
  const liveRegion = document.createElement('div');
  liveRegion.id = 'aria-live-region';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'visually-hidden';
  document.body.appendChild(liveRegion);
  return liveRegion;
};

// ============================================================================
// ACCESSIBILITY FUNCTIONS
// ============================================================================

/**
 * Announce message to screen readers using ARIA live region
 * @param {string} message - The message to announce
 * @param {string} [priority='polite'] - Priority level ('polite' or 'assertive')
 */
const announceToScreenReader = (message, priority = 'polite') => {
  if (!ariaLiveRegion) {
    ariaLiveRegion = createAriaLiveRegion();
  }

  // Set priority level
  ariaLiveRegion.setAttribute('aria-live', priority);

  // Clear previous message
  ariaLiveRegion.textContent = '';

  // Add new message
  setTimeout(() => {
    ariaLiveRegion.textContent = message;
  }, 10);

  // Reset to polite after assertive announcements
  if (priority === 'assertive') {
    setTimeout(() => {
      ariaLiveRegion.setAttribute('aria-live', 'polite');
    }, 1000);
  }
};

/**
 * Handle timer errors with enhanced user feedback
 * @param {string} errorMessage - The error message to display and announce
 */
const handleTimerError = (errorMessage) => {
  const countdownDisplay = document.getElementById('countdown-display');
  countdownDisplay.textContent = errorMessage;
  countdownDisplay.setAttribute('aria-live', 'assertive');

  // Visual feedback for errors
  countdownDisplay.style.color = 'var(--color-accent)';
  countdownDisplay.style.fontWeight = 'bold';

  // Reset styling after 3 seconds
  setTimeout(() => {
    countdownDisplay.style.color = '';
    countdownDisplay.style.fontWeight = '';
    countdownDisplay.setAttribute('aria-live', 'polite');
  }, 3000);

  announceToScreenReader(errorMessage, 'assertive');
};

/**
 * Announce clock mode changes to screen readers
 * @param {string} mode - The clock mode ID that was activated
 */
const announceClockMode = (mode) => {
  const announcements = {
    'real-time-clock': 'Real-time clock mode activated. Current time and date are displayed.',
    'stopwatch': 'Stopwatch mode activated. Use Start button to begin timing, Lap to record split times.',
    'countdown-timer': 'Countdown timer mode activated. Set time using presets or custom input, then press Start.'
  };

  const message = announcements[mode] || `${mode} mode activated`;
  announceToScreenReader(message);
};

// ============================================================================
// KEYBOARD NAVIGATION AND EVENT LISTENERS
// ============================================================================

/**
 * Keyboard navigation and accessibility event handlers
 * Handles ESC, Space, Arrow keys, and Enter key interactions
 */
document.addEventListener('keydown', (event) => {
  // ESC key to stop any running timers
  if (event.key === 'Escape') {
    event.preventDefault();
    if (countdownIntervalId) {
      stopCountdownTimer();
    }
    if (stopwatchData.animationFrameId) {
      document.getElementById('stop-button').click();
    }
  }

  // Space bar for start/stop functionality
  if (event.key === ' ' && event.target.tagName !== 'BUTTON' && event.target.tagName !== 'SELECT' && event.target.tagName !== 'INPUT') {
    event.preventDefault();
    const activeMode = document.querySelector('.clock-container:not([style*="display:none"])');

    if (activeMode) {
      if (activeMode.id === 'stopwatch') {
        const startBtn = document.getElementById('start-button');
        const stopBtn = document.getElementById('stop-button');

        if (!startBtn.disabled) {
          startBtn.click();
        } else if (!stopBtn.disabled) {
          stopBtn.click();
        }
      } else if (activeMode.id === 'countdown-timer') {
        const timerStartBtn = document.getElementById('timer-start-button');
        const timerStopBtn = document.getElementById('timer-stop-button');

        if (!timerStartBtn.disabled) {
          timerStartBtn.click();
        } else {
          timerStopBtn.click();
        }
      }
    }
  }

  // Arrow keys for timer adjustment when focused on spinner inputs
  if (event.target.classList.contains('timer-input')) {
    const type = event.target.id.includes('minutes') ? 'minutes' : 'seconds';

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      adjustTimerValue(type, 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      adjustTimerValue(type, -1);
    }
  }

  // Enter key to activate buttons when focused
  if (event.key === 'Enter' && event.target.tagName === 'BUTTON') {
    event.preventDefault();
    event.target.click();
  }
});

/**
 * Enhanced focus management for better keyboard navigation
 * Provides audio feedback when focusing on timer inputs
 */
document.addEventListener('focusin', (event) => {
  // Add focus announcements for complex controls
  if (event.target.classList.contains('timer-input')) {
    const type = event.target.id.includes('minutes') ? 'minutes' : 'seconds';
    const value = event.target.value;

    // Clear the input if it contains only "0" to prevent accidental typing like "40" instead of "4"
    if (value === '0') {
      event.target.value = '';
      event.target.select(); // Select all text (empty in this case)
    }

    announceToScreenReader(`${type} input focused, current value: ${value}. Use arrow keys or plus/minus buttons to adjust.`);
  }
});

/**
 * Validate timer input values and update preview
 * Ensures input values stay within valid range (0-59)
 * @param {Event} event - Input event from timer input field
 */
const validateAndUpdateTimer = (event) => {
  const input = event.target;
  let value = input.value;

  // If empty value, set to 0
  if (value === '') {
    input.value = '0';
    updateTimerPreview();
    return;
  }

  // Parse and validate the value
  let numValue = parseInt(value);

  // If not a valid number, reset to 0
  if (isNaN(numValue)) {
    input.value = '0';
    updateTimerPreview();
    return;
  }

  // Ensure value is within valid range
  if (numValue < 0) {
    input.value = '0';
  } else if (numValue > 59) {
    input.value = '59';
  }

  updateTimerPreview();
};
