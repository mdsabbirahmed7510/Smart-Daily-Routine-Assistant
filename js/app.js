// ===================================================================
//  SMART DAILY ROUTINE ASSISTANT - COMPLETE APP.JS
// ===================================================================

// ==================== APPLICATION STATE ====================
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// ==================== DEVICE DETECTION (NEW) ====================
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

// ==================== PLATFORM NOTIFICATION SETUP (NEW) ====================
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

// ==================== TOAST FUNCTION (NEW) ====================
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

// ==================== iOS MESSAGE FUNCTION (NEW) ====================
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

// ==================== BROWSER NOTIFICATION (UPDATED) ====================
function showBrowserNotification(taskName, time) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('⏰ Smart Reminder', {
        body: `Time to start: ${taskName} (${time})`,
        icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
        vibrate: [200, 100, 200],
        tag: 'reminder',
        requireInteraction: true
      });
    });
  } 
  else if (Notification.permission === 'granted') {
    new Notification('⏰ Smart Reminder', {
      body: `Time to start: ${taskName} (${time})`,
      icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
      vibrate: [200, 100, 200]
    });
  }
}

// ==================== LEGACY NOTIFICATION (for compatibility) ====================
function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
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

// ==================== INSTALL PROMPT ====================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const installBtn = document.createElement('button');
  installBtn.innerHTML = '📲 Install App';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #4F46E5;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 30px;
    font-weight: bold;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  `;
  
  installBtn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.remove();
      }
      deferredPrompt = null;
    }
  };
  
  document.body.appendChild(installBtn);
});

// ==================== INITIALIZATION ====================
function init() {
  render();
  setupPlatformNotifications();
  requestNotificationPermission();
  startTimers();
  registerServiceWorker();
  showIOSMessage();
}

// ==================== START APPLICATION ====================
document.addEventListener('DOMContentLoaded', init);
