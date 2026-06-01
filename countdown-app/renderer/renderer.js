// DOM elements
const container = document.getElementById('container');
const elTitle = document.getElementById('eventTitle');
const elDays = document.getElementById('days');
const elHours = document.getElementById('hours');
const elMinutes = document.getElementById('minutes');
const elSeconds = document.getElementById('seconds');
const elSecondsUnit = document.getElementById('secondsUnit');
const elDateRow = document.getElementById('dateRow');
const elStatusRow = document.getElementById('statusRow');
const elCountdownRow = document.getElementById('countdownRow');

let targetDate = null;
let title = '';

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y} 年 ${m} 月 ${d} 日`;
}

function updateCountdown() {
  if (!targetDate) return;

  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    // Past or today
    const diffDays = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
    elCountdownRow.style.display = 'none';
    elDateRow.textContent = formatDate(targetDate);

    if (diffDays === 0) {
      elStatusRow.textContent = `🎉 今天就是 ${title}！`;
      elStatusRow.className = 'status-row today';
    } else {
      elStatusRow.textContent = `${title} 已过去 ${diffDays} 天`;
      elStatusRow.className = 'status-row past';
    }
    return;
  }

  // Future
  elCountdownRow.style.display = 'flex';
  elStatusRow.textContent = '';
  elStatusRow.className = 'status-row';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  elDays.textContent = days;
  elHours.textContent = pad(hours);
  elMinutes.textContent = pad(minutes);
  elSeconds.textContent = pad(seconds);

  elDateRow.textContent = formatDate(targetDate);
}

async function applySettings(s) {
  title = s.title || '';
  targetDate = s.targetDate ? new Date(s.targetDate + 'T00:00:00') : null;

  elTitle.textContent = title;

  // Apply font size
  document.documentElement.style.setProperty('--font-size', (s.fontSize || 26) + 'px');

  // Apply accent color
  document.documentElement.style.setProperty('--accent-color', s.accentColor || '#64B5F6');

  // Apply background opacity
  document.documentElement.style.setProperty('--bg-opacity', s.bgOpacity || 0.75);

  // Show/hide seconds
  elSecondsUnit.style.display = s.showSeconds ? 'flex' : 'none';

  // Lock position
  if (s.lockPosition) {
    container.classList.add('locked');
  } else {
    container.classList.remove('locked');
  }

  updateCountdown();
}

async function init() {
  const settings = await window.electronAPI.getSettings();
  await applySettings(settings);

  // Listen for settings changes from main process
  window.electronAPI.onSettingsChanged((newSettings) => {
    applySettings(newSettings);
  });

  window.electronAPI.onLockPositionChanged((locked) => {
    if (locked) {
      container.classList.add('locked');
    } else {
      container.classList.remove('locked');
    }
  });

  // Double-click to open settings
  container.addEventListener('dblclick', () => {
    window.electronAPI.openSettings();
  });

  // Right-click: send to main process to show context menu
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.electronAPI.showContextMenu();
  });

  // JS-based window dragging (replaces -webkit-app-region: drag to avoid system menu)
  // Uses requestAnimationFrame to throttle IPC calls — sending a message on every
  // mousemove pixel causes a feedback loop where setBounds triggers new mousemove
  // events, making the window "run away" or enlarge infinitely.
  let dragging = false, sx = 0, sy = 0;
  let pendingDx = 0, pendingDy = 0;
  let rafId = null;

  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // left-click only
    if (container.classList.contains('locked')) return;
    dragging = true;
    sx = e.screenX;
    sy = e.screenY;
    pendingDx = 0;
    pendingDy = 0;
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    // Accumulate deltas — between rAF frames we may get many mousemove events
    pendingDx += e.screenX - sx;
    pendingDy += e.screenY - sy;
    sx = e.screenX;
    sy = e.screenY;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!dragging) return;
        if (pendingDx !== 0 || pendingDy !== 0) {
          window.electronAPI.moveWindow(pendingDx, pendingDy);
          pendingDx = 0;
          pendingDy = 0;
        }
      });
    }
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
    pendingDx = 0;
    pendingDy = 0;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });

  // Update every second
  setInterval(updateCountdown, 1000);

  // Update title attribute for tooltip
  updateTitleTooltip();
}

function updateTitleTooltip() {
  if (targetDate) {
    document.title = `倒计时 - ${title}`;
  }
}

init();
