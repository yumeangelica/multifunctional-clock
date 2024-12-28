document.addEventListener('DOMContentLoaded', () => {
  realtimeClock();  // Call the function to display the real-time clock when the page is loaded
});

/* Real-time clock */
const realtimeClock = () => {
  const updateClock = () => {
    const date = new Date();
    const day = date.getDate();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const dateString = `${day}/${month}/${year}`;

    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
    document.getElementById('rtdate').textContent = dateString;

    // Select the greeting message based on the time
    const greetings = {
      '04:03': 'The clock is forbidden!',
      '04:04': 'Clock is not found.',
      '04:20': "It's a global Amsterdam time..."
    };

    const defaultGreetings = [
      { range: [0, 5], message: 'Good Night!' },
      { range: [5, 11], message: 'Good Morning!' },
      { range: [11, 17], message: 'Good Day!' },
      { range: [17, 23], message: 'Good Evening!' }
    ];

    const greeting = greetings[`${hours}:${minutes}`] ?? defaultGreetings.find(({ range }) => hours >= range[0] && hours < range[1])?.message; // Set the greeting message

    document.getElementById('greeting').textContent = greeting;
  };

  updateClock();
  setInterval(updateClock, 1000);
};

/* Timer */
let countdownTimerId = null;
const countdownTimer = () => {
  document.getElementById('timerstart').disabled = true;

  // Get the input values and calculate the total time in seconds
  const minutesToSeconds = 60 * (parseInt(document.getElementById('inputminutes').value) || 0); // If not entered, default value 0
  const inputseconds = parseInt(document.getElementById('inputseconds').value) || 0; // If not entered, default value 0
  let timeleft = minutesToSeconds + inputseconds;

  // Check if the input is valid
  if (isNaN(timeleft) || timeleft <= 0) {
    document.getElementById('countdown').textContent = 'Please enter valid time!';
    document.getElementById('timerstart').disabled = false;
    return;
  }

  countdownTimerId = setInterval(() => {
    if (timeleft <= 0) {
      clearInterval(countdownTimerId);
      document.getElementById('countdown').textContent = 'Finished';
      alert('Time is Over!');
      document.getElementById('timerstart').disabled = false;
    } else {
      document.getElementById('countdown').textContent = `${timeleft} seconds remaining`;
    }
    timeleft -= 1;
  }, 1000);
};


const timerstop = () => {
  clearInterval(countdownTimerId);
  document.getElementById('timerstart').disabled = false;
  document.getElementById('countdown').textContent = 'Finished';
  document.getElementById('inputminutes').value = '';
  document.getElementById('inputseconds').value = '';
};


/* Clock mode switch functions */
const switchFrame = (frameId) => {
  // Gets all elements with the class "clockmainframe"
  const frames = document.querySelectorAll('.clockmainframe');

  // Hides all frames and shows only the selected one
  frames.forEach(frame => {
    frame.style.display = frame.id === frameId ? 'block' : 'none';
  });
};

/* Stopwatch */
const timeDisplay = document.getElementById('displaytime');
const startBtn = document.getElementById('startbutton');
const lapBtn = document.getElementById('lapbutton');
const stopBtn = document.getElementById('stopbutton');
const clearBtn = document.getElementById('clearbutton');
const lapTimes = document.getElementById('laptimelist');

let data = { lapTimes: [], animateFrame: 0, nowTime: 0, diffTime: 0, startTime: 0 };

const startTimer = () => {
  if (typeof data.diffTime === 'undefined') data.diffTime = 0;
  data.startTime = Math.floor(performance.now() - data.diffTime);

  const loop = () => {
    data.nowTime = Math.floor(performance.now());
    data.diffTime = data.nowTime - data.startTime;

    timeDisplay.textContent = `${computed.hours()}:${computed.minutes()}´${computed.seconds()}´´${computed.milliseconds()}`;
    data.animateFrame = requestAnimationFrame(loop);
  };

  loop();
};

const pushTimes = () => {
  data.lapTimes.push({
    hours: computed.hours(),
    minutes: computed.minutes(),
    seconds: computed.seconds(),
    milliseconds: computed.milliseconds()
  });
};

const clearAll = () => {
  data.startTime = 0;
  data.nowTime = 0;
  data.diffTime = 0;
  data.lapTimes = [];
  data.animateFrame = 0;
  timeDisplay.textContent = '00:00´00´´000';
  lapTimes.textContent = '';
};

const computed = {
  hours() { return zeroFixer(Math.floor(data.diffTime / 1000 / 60 / 60)); },
  minutes() { return zeroFixer(Math.floor(data.diffTime / 1000 / 60) % 60); },
  seconds() { return zeroFixer(Math.floor(data.diffTime / 1000) % 60); },
  milliseconds() { return zeroFixer(Math.floor(data.diffTime % 1000), 3); }
};

const zeroFixer = (value, num = 2) => value.toString().padStart(num, '0');

startBtn.onclick = () => {
  startBtn.disabled = true;
  lapBtn.disabled = false;
  stopBtn.disabled = false;
  clearBtn.disabled = true;
  startTimer();
};

lapBtn.onclick = () => {
  pushTimes();
  const newlap = document.createElement('li');
  newlap.textContent = `${data.lapTimes[data.lapTimes.length - 1].hours}:${data.lapTimes[data.lapTimes.length - 1].minutes}´${data.lapTimes[data.lapTimes.length - 1].seconds}´´${data.lapTimes[data.lapTimes.length - 1].milliseconds}`;
  lapTimes.appendChild(newlap);  // Adds the new lap time to the list
};

stopBtn.onclick = () => {
  startBtn.disabled = false;
  lapBtn.disabled = true;
  stopBtn.disabled = true;
  clearBtn.disabled = false;
  startBtn.textContent = 'Resume';
  cancelAnimationFrame(data.animateFrame);
};

clearBtn.onclick = () => {
  startBtn.disabled = false;
  lapBtn.disabled = true;
  stopBtn.disabled = true;
  clearBtn.disabled = true;
  startBtn.textContent = 'Start';
  clearAll();
};
