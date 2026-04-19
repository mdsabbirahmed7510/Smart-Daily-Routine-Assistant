// ===================================================================
//  SMART DAILY ROUTINE ASSISTANT - COMPLETE APP.JS
//  (With Sound + Install Popup + Permanent Button)
// ===================================================================

// ==================== APPLICATION STATE ====================
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// ==================== DEVICE DETECTION ====================
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// ==================== PLAY SOUND FUNCTION ====================
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 600);
  } catch(e) {
    console.log('Web Audio not supported:', e);
    try {
      const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch(err) {
      console.log('Sound not available');
    }
  }
}

// ==================== PLATFORM NOTIFICATION SETUP ====================
function setupPlatformNotifications() {
  if (isIOS()) {
    console.log('🍎 iOS device detected - notifications may be limited');
    
    const requestIOSPermission = () => {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('iOS notification permission granted');
          } else {
            console.log('iOS notification permission denied');
          }
        });
      }
      document.removeEventListener('click', requestIOSPermission);
    };
    
    document.addEventListener('click', requestIOSPermission);
  } 
  else if (isAndroid()) {
    console.log('🤖 Android device detected - full notification support');
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } else {
    console.log('💻 Desktop browser detected');
  }
}

// ==================== TOAST FUNCTION ====================
function showToast(message, duration = 3000) {
  let statusDiv = document.getElementById('notificationStatus');
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.id = 'notificationStatus';
    statusDiv.className = 'notification-status';
    document.body.appendChild(statusDiv);
  }
  
  const toast = document.createElement('div');
  toast.className = 'notif-toast';
  toast.innerHTML = message;
  statusDiv.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
}

// ==================== iOS MESSAGE FUNCTION ====================
function showIOSMessage() {
  if (isIOS() && !isPWA()) {
    setTimeout(() => {
      showToast('📱 Install this app: Tap Share → Add to Home Screen', 5000);
    }, 2000);
    
    setTimeout(() => {
      showToast('🔔 For notifications: Settings → Safari → Notifications → Allow', 8000);
    }, 5000);
  } else if (isIOS() && isPWA()) {
    setTimeout(() => {
      showToast('✅ App installed! Allow notifications from Settings', 4000);
    }, 2000);
  }
}

// ==================== BROWSER NOTIFICATION (WITH SOUND) ====================
function showBrowserNotification(taskName, time) {
  playNotificationSound();
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('⏰ Smart Reminder', {
        body: `Time to start: ${taskName} (${time})`,
        icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
        vibrate: [200, 100, 200, 100, 300],
        tag: 'reminder',
        requireInteraction: true,
        silent: false
      });
    });
  } 
  else if (Notification.permission === 'granted') {
    new Notification('⏰ Smart Reminder', {
      body: `Time to start: ${taskName} (${time})`,
      icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
      vibrate: [200, 100, 200],
      silent: false
    });
  }
}

// ==================== LEGACY NOTIFICATION ====================
function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

// ==================== INSTALL POPUP FUNCTIONS ====================

// Check if app is already installed
function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Get device type for specific instructions
function getDeviceType() {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'other';
}

// Get install instructions based on device
function getInstallInstructions() {
  const device = getDeviceType();
  
  if (device === 'ios') {
    return {
      title: '📱 Install on iPhone/iPad',
      steps: [
        'Tap the Share button (📤) at the bottom',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" in the top right corner'
      ],
      buttonText: '📤 Show Me How',
      icon: '🍎'
    };
  } else if (device === 'android') {
    return {
      title: '🤖 Install on Android',
      steps: [
        'Click "Install" button below',
        'Tap "Install" on the popup',
        'App will be added to your home screen'
      ],
      buttonText: '📲 Install Now',
      icon: '📱'
    };
  } else {
    return {
      title: '💻 Install on Desktop',
      steps: [
        'Click "Install" button below',
        'Click "Install" on the popup',
        'Open from desktop like a regular app'
      ],
      buttonText: '💻 Install Now',
      icon: '🖥️'
    };
  }
}

// Create permanent install button
function createPermanentInstallButton() {
  if (document.getElementById('permanentInstallBtn')) return;
  if (isAppInstalled()) return;
  
  const installBtn = document.createElement('button');
  installBtn.id = 'permanentInstallBtn';
  installBtn.innerHTML = '📲 Install App (Get Full Features)';
  
  installBtn.onclick = () => {
    showInstallPopup();
  };
  
  const container = document.querySelector('.container');
  const addTaskCard = document.querySelector('.add-task-card');
  if (container && addTaskCard && !document.getElementById('permanentInstallBtn')) {
    container.insertBefore(installBtn, addTaskCard);
  }
}

function removePermanentInstallButton() {
  const btn = document.getElementById('permanentInstallBtn');
  if (btn) btn.remove();
}

// Show install popup
function showInstallPopup() {
  if (isAppInstalled()) {
    removePermanentInstallButton();
    return;
  }
  
  const instructions = getInstallInstructions();
  const device = getDeviceType();
  
  const existingPopup = document.querySelector('.install-popup');
  if (existingPopup) existingPopup.remove();
  
  const popup = document.createElement('div');
  popup.className = `install-popup ${device}-install`;
  popup.innerHTML = `
    <h4>
      <span>${instructions.icon}</span> 
      ${instructions.title}
    </h4>
    <p>✨ <strong>Install this app</strong> to get all features:<br>
    • 🔔 Notifications even when app is closed<br>
    • 📴 Works offline • ⚡ Faster performance<br>
    • 📱 Like a real mobile app!</p>
    
    <div class="install-steps">
      <strong>📌 How to install:</strong>
      <ol>
        ${instructions.steps.map(step => `<li>${step}</li>`).join('')}
      </ol>
    </div>
    
    <div class="install-buttons">
      <button class="install-btn" id="installNowBtn">${instructions.buttonText}</button>
      <button class="later-btn" id="installLaterBtn">⏰ Remind Me Later</button>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  document.getElementById('installNowBtn').addEventListener('click', () => {
    popup.remove();
    
    if (device === 'android' && deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('✅ App installed successfully!');
          removePermanentInstallButton();
        } else {
          createPermanentInstallButton();
        }
        deferredPrompt = null;
      });
    } 
    else if (device === 'ios') {
      showToast('📲 Tap Share → Add to Home Screen to install', 5000);
      showIOSInstallGuide();
      createPermanentInstallButton();
    }
    else {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            showToast('✅ App installed successfully!');
            removePermanentInstallButton();
          } else {
            createPermanentInstallButton();
          }
          deferredPrompt = null;
        });
      } else {
        createPermanentInstallButton();
      }
    }
  });
  
  document.getElementById('installLaterBtn').addEventListener('click', () => {
    popup.remove();
    createPermanentInstallButton();
    showToast('💡 You can install anytime using the orange button below', 4000);
  });
}

// iOS Visual Guide
function showIOSInstallGuide() {
  const guide = document.createElement('div');
  guide.className = 'install-popup ios-install';
  guide.style.position = 'fixed';
  guide.style.top = '50%';
  guide.style.left = '50%';
  guide.style.transform = 'translate(-50%, -50%)';
  guide.style.maxWidth = '320px';
  guide.style.zIndex = '10001';
  guide.innerHTML = `
    <h4>🍎 How to Install on iPhone</h4>
    <div style="text-align: center; margin: 20px 0;">
      <div style="font-size: 48px;">📤</div>
      <div style="margin: 10px 0;">Step 1: Tap Share</div>
      <div style="font-size: 48px;">⬇️</div>
      <div style="margin: 10px 0;">Step 2: Tap "Add to Home Screen"</div>
      <div style="font-size: 48px;">✅</div>
      <div style="margin: 10px 0;">Step 3: Tap "Add"</div>
    </div>
    <button class="install-btn" id="closeGuideBtn" style="width: 100%;">Got it!</button>
  `;
  
  document.body.appendChild(guide);
  
  document.getElementById('closeGuideBtn').addEventListener('click', () => {
    guide.remove();
  });
}

// Show popup after page loads
function showInstallPopupWithDelay() {
  if (isAppInstalled()) {
    removePermanentInstallButton();
    return;
  }
  
  setTimeout(() => {
    showInstallPopup();
  }, 2000);
}

// ==================== RENDER FUNCTION ====================
function render() {
  const root = document.getElementById('root');
  if (!root) return;
  
  root.innerHTML = `
    <div class="container">
      <h1>📋 Smart Daily Routine Assistant</h1>
      
      <div class="current-time" id="currentTime"></div>
      
      <div class="add-task-card">
        <h3>➕ Add New Task</h3>
        <form id="taskForm">
          <input type="text" id="taskName" placeholder="What to do? (e.g., Study, Exercise)" required>
          <div class="time-inputs">
            <input type="time" id="startTime" required>
            <span>to</span>
            <input type="time" id="endTime" required>
          </div>
          <button type="submit" class="btn-primary">➕ Add Task</button>
        </form>
      </div>
      
      <div class="routine-section">
        <h3>📌 Today's Routine</h3>
        <div id="taskList"></div>
      </div>
      
      <div id="notificationStatus"></div>
    </div>
  `;
  
  const form = document.getElementById('taskForm');
  if (form) {
    form.addEventListener('submit', addTask);
  }
  
  renderTaskList();
  updateCurrentTime();
  
  // Create permanent install button after render
  if (!isAppInstalled()) {
    createPermanentInstallButton();
  }
}

// ==================== RENDER TASK LIST ====================
function renderTaskList() {
  const taskListDiv = document.getElementById('taskList');
  if (!taskListDiv) return;
  
  if (tasks.length === 0) {
    taskListDiv.innerHTML = '<div class="empty-state">🎯 No tasks added yet<br>📝 Use the form above to add tasks</div>';
    return;
  }
  
  taskListDiv.innerHTML = tasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}">
      <div class="task-info">
        <div class="task-name">
          ${escapeHtml(task.name)}
          <span class="task-status ${task.completed ? 'status-done' : 'status-pending'}">
            ${task.completed ? '✅ Completed' : '⏳ Pending'}
          </span>
        </div>
        <div class="task-time">
          🕐 ${task.startTime} - ${task.endTime}
          ${!task.completed && task.reminderCount > 0 ? `<span style="color: #ff9800; margin-left: 10px;">🔔 Reminder: ${task.reminderCount}/3</span>` : ''}
        </div>
      </div>
      <div>
        ${!task.completed ? `<button class="done-btn" onclick="markAsDone(${task.id})">✅ Done</button>` : ''}
        <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

// ==================== UPDATE CURRENT TIME ====================
function updateCurrentTime() {
  const timeElement = document.getElementById('currentTime');
  if (!timeElement) return;
  
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  timeElement.innerHTML = `🕐 ${timeString}`;
}

// ==================== ADD TASK ====================
function addTask(e) {
  e.preventDefault();
  
  const taskName = document.getElementById('taskName')?.value;
  const startTime = document.getElementById('startTime')?.value;
  const endTime = document.getElementById('endTime')?.value;
  
  if (!taskName || !startTime || !endTime) {
    showToast('⚠️ Please fill in all fields!');
    return;
  }
  
  const newTask = {
    id: Date.now(),
    name: taskName,
    startTime: startTime,
    endTime: endTime,
    completed: false,
    reminderCount: 0,
    createdAt: new Date().toISOString()
  };
  
  tasks.push(newTask);
  saveTasks();
  renderTaskList();
  
  document.getElementById('taskForm')?.reset();
  showToast('✅ Task added successfully!');
}

// ==================== DELETE TASK ====================
function deleteTask(id) {
  if (confirm('❓ Delete this task?')) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTaskList();
    showToast('🗑️ Task deleted');
  }
}

// ==================== MARK AS DONE ====================
function markAsDone(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = true;
    saveTasks();
    renderTaskList();
    showToast(`🎉 "${task.name}" completed! Great job!`);
    clearReminders(task);
  }
}

// ==================== CHECK TASK REMINDERS ====================
function checkTaskReminders() {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  tasks.forEach(task => {
    if (!task.completed && task.startTime === currentTime) {
      triggerReminder(task);
    }
  });
}

// ==================== TRIGGER REMINDER ====================
function triggerReminder(task) {
  if (task.reminderCount >= 3) return;
  
  task.reminderCount++;
  saveTasks();
  renderTaskList();
  
  showBrowserNotification(task.name, task.startTime);
  showToast(`⏰ Time for: "${task.name}". Please complete it!`);
  
  if (task.reminderCount < 3 && !task.completed) {
    setTimeout(() => {
      if (!task.completed) {
        triggerReminder(task);
      }
    }, 300000);
  }
}

// ==================== CLEAR REMINDERS ====================
function clearReminders(task) {
  task.reminderCount = 3;
  saveTasks();
  renderTaskList();
}

// ==================== END OF DAY EVALUATION ====================
function checkEndOfDay() {
  const now = new Date();
  if (now.getHours() === 23 && now.getMinutes() === 59) {
    evaluateDay();
  }
}

function evaluateDay() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  
  if (totalTasks === 0) return;
  
  if (completedTasks === totalTasks) {
    showToast('🎉🥳 Amazing! You completed all tasks today! You are a productivity hero!');
    showBrowserNotification('Congratulations!', 'All tasks completed today! So proud of you!');
  } else {
    const missed = totalTasks - completedTasks;
    showToast(`💪 ${missed} task(s) missed. Don't worry, try harder tomorrow! Keep going!`);
    showBrowserNotification('Motivation', `${missed} task(s) remaining. You can do better tomorrow!`);
  }
}

// ==================== HELPER FUNCTIONS ====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ==================== START TIMERS ====================
function startTimers() {
  updateCurrentTime();
  setInterval(() => {
    updateCurrentTime();
    checkTaskReminders();
    checkEndOfDay();
  }, 1000);
}

// ==================== SERVICE WORKER REGISTRATION ====================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker registered:', reg))
      .catch(err => console.log('❌ Service Worker failed:', err));
  }
}

// ==================== INSTALL PROMPT (BROWSER NATIVE) ====================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// ==================== INITIALIZATION ====================
function init() {
  render();
  setupPlatformNotifications();
  requestNotificationPermission();
  startTimers();
  registerServiceWorker();
  showIOSMessage();
  
  if (!isAppInstalled()) {
    showInstallPopupWithDelay();
  }
}

// ==================== START APPLICATION ====================
document.addEventListener('DOMContentLoaded', init);
