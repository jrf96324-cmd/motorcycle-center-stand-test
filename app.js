const state = {
  mode: 'auto',
  running: false,
  emergency: false,
  servoDown: true,
  cylinderBack: false,
  cycle: 0,
  force: 0,
  angle: 0,
  alarms: []
};

const el = {
  autoModeBtn: document.getElementById('autoModeBtn'),
  manualModeBtn: document.getElementById('manualModeBtn'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  estopBtn: document.getElementById('estopBtn'),
  resetEmergencyBtn: document.getElementById('resetEmergencyBtn'),
  servoStatus: document.getElementById('servoStatus'),
  cylinderStatus: document.getElementById('cylinderStatus'),
  cycleCount: document.getElementById('cycleCount'),
  forceValue: document.getElementById('forceValue'),
  angleValue: document.getElementById('angleValue'),
  alarmList: document.getElementById('alarmList'),
  clearAlarmBtn: document.getElementById('clearAlarmBtn'),
  exportBtn: document.getElementById('exportBtn')
};

let timer = null;

function render() {
  el.autoModeBtn.classList.toggle('active', state.mode === 'auto');
  el.manualModeBtn.classList.toggle('active', state.mode === 'manual');
  el.startBtn.disabled = state.emergency;
  el.resetEmergencyBtn.disabled = !state.emergency;

  el.servoStatus.textContent = state.servoDown ? 'ON' : 'OFF';
  el.servoStatus.className = `state-pill ${state.servoDown ? 'on' : 'off'}`;
  el.cylinderStatus.textContent = state.cylinderBack ? 'ON' : 'OFF';
  el.cylinderStatus.className = `state-pill ${state.cylinderBack ? 'on' : 'off'}`;

  el.cycleCount.textContent = String(state.cycle);
  el.forceValue.textContent = state.force.toFixed(1);
  el.angleValue.textContent = state.angle.toFixed(1);

  if (state.alarms.length === 0) {
    el.alarmList.innerHTML = '<li class="alarm-item ok">目前無異常</li>';
  } else {
    el.alarmList.innerHTML = state.alarms
      .map((a) => `<li class="alarm-item ${a.level}">${a.message}</li>`)
      .join('');
  }
}

function pushAlarm(level, message) {
  state.alarms.unshift({ level, message });
  state.alarms = state.alarms.slice(0, 6);
  render();
}

function setMode(mode) {
  state.mode = mode;
  pushAlarm('warn', `已切換為${mode === 'auto' ? '自動' : '手動'}模式`);
  render();
}

function startTest() {
  if (state.running || state.emergency) return;
  state.running = true;
  timer = setInterval(() => {
    if (!state.running) return;
    state.cycle += 1;
    state.force = 72 + Math.random() * 8;
    state.angle = 21 + Math.random() * 5;
    state.servoDown = !state.servoDown;
    state.cylinderBack = !state.servoDown;

    if (state.force > 78.5) {
      pushAlarm('warn', `力量偏高：${state.force.toFixed(1)} kgf`);
    }
    render();
  }, 1200);
  pushAlarm('ok', '測試已啟動');
}

function stopTest() {
  state.running = false;
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  pushAlarm('warn', '測試已停止');
}

function emergencyStop() {
  state.emergency = true;
  stopTest();
  state.servoDown = false;
  state.cylinderBack = true;
  pushAlarm('danger', '急停觸發，請檢查設備後再執行急停復歸');
  render();
}

function clearAlarms() {
  state.alarms = [];
  render();
}

function resetEmergency() {
  if (!state.emergency) return;
  state.emergency = false;
  pushAlarm('ok', '急停已復歸，可重新啟動測試');
}

el.autoModeBtn.addEventListener('click', () => setMode('auto'));
el.manualModeBtn.addEventListener('click', () => setMode('manual'));
el.startBtn.addEventListener('click', startTest);
el.stopBtn.addEventListener('click', stopTest);
el.estopBtn.addEventListener('click', emergencyStop);
el.resetEmergencyBtn.addEventListener('click', resetEmergency);
el.clearAlarmBtn.addEventListener('click', clearAlarms);
el.exportBtn.addEventListener('click', () => {
  const report = {
    timestamp: new Date().toISOString(),
    mode: state.mode,
    cycle: state.cycle,
    force: state.force,
    angle: state.angle,
    alarms: state.alarms
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `center-stand-report-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}

render();
