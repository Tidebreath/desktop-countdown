// Form elements
const inputTitle = document.getElementById('inputTitle');
const inputDate = document.getElementById('inputDate');
const inputFontSize = document.getElementById('inputFontSize');
const fontSizeVal = document.getElementById('fontSizeVal');
const inputColor = document.getElementById('inputColor');
const colorHex = document.getElementById('colorHex');
const inputOpacity = document.getElementById('inputOpacity');
const opacityVal = document.getElementById('opacityVal');
const inputShowSeconds = document.getElementById('inputShowSeconds');
const inputAlwaysOnTop = document.getElementById('inputAlwaysOnTop');
const inputLockPosition = document.getElementById('inputLockPosition');
const inputAutoStart = document.getElementById('inputAutoStart');
const inputWinW = document.getElementById('inputWinW');
const inputWinH = document.getElementById('inputWinH');
const btnResetSize = document.getElementById('btnResetSize');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');

let currentSettings = {};

async function init() {
  currentSettings = await window.electronAPI.getSettings();

  // Populate form
  inputTitle.value = currentSettings.title || '';
  inputDate.value = currentSettings.targetDate || '';
  inputFontSize.value = currentSettings.fontSize || 26;
  inputColor.value = currentSettings.accentColor || '#64B5F6';
  inputOpacity.value = currentSettings.bgOpacity || 0.75;
  inputShowSeconds.checked = currentSettings.showSeconds !== false;
  inputAlwaysOnTop.checked = currentSettings.alwaysOnTop !== false;
  inputLockPosition.checked = currentSettings.lockPosition === true;
  inputAutoStart.checked = currentSettings.autoStart === true;
  inputWinW.value = currentSettings.windowW || 400;
  inputWinH.value = currentSettings.windowH || 180;

  updateLabels();

  // Reset window size to defaults
  btnResetSize.addEventListener('click', () => {
    inputWinW.value = 400;
    inputWinH.value = 180;
  });

  // Live preview updates
  inputFontSize.addEventListener('input', updateLabels);
  inputColor.addEventListener('input', updateLabels);
  inputOpacity.addEventListener('input', updateLabels);

  // Save
  btnSave.addEventListener('click', async () => {
    const newSettings = {
      title: inputTitle.value.trim() || '倒计时',
      targetDate: inputDate.value,
      fontSize: parseInt(inputFontSize.value),
      accentColor: inputColor.value,
      bgOpacity: parseFloat(inputOpacity.value),
      showSeconds: inputShowSeconds.checked,
      alwaysOnTop: inputAlwaysOnTop.checked,
      lockPosition: inputLockPosition.checked,
      autoStart: inputAutoStart.checked,
      windowW: parseInt(inputWinW.value) || 400,
      windowH: parseInt(inputWinH.value) || 180
    };

    if (!newSettings.targetDate) {
      alert('请选择目标日期');
      return;
    }

    await window.electronAPI.saveSettings(newSettings);
    window.electronAPI.closeSettingsWindow();
  });

  // Cancel
  btnCancel.addEventListener('click', () => {
    window.electronAPI.closeSettingsWindow();
  });

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      btnSave.click();
    } else if (e.key === 'Escape') {
      btnCancel.click();
    }
  });
}

function updateLabels() {
  fontSizeVal.textContent = inputFontSize.value + 'px';
  colorHex.textContent = inputColor.value;
  opacityVal.textContent = Math.round(inputOpacity.value * 100) + '%';
}

init();
