// Application state
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// DOM root element
const root = document.getElementById('root');

// Main render function
function render() {
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
    
    // Form submit event
    const form = document.getElementById('taskForm');
    if (form) {
        form.addEventListener('submit', addTask);
    }
    
    // Render task list
    renderTaskList();
    
    // Update time
    updateCurrentTime();
}

// Render task list
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

// Update current time
function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    if (!timeElement) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    timeElement.innerHTML = `🕐 ${timeString}`;
}

// Add new task
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
    
    // Reset form
    document.getElementById('taskForm')?.reset();
    showToast('✅ Task added successfully!');
}

// Delete task
function deleteTask(id) {
    if (confirm('❓ Delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTaskList();
        showToast('🗑️ Task deleted');
    }
}

// Mark task as done
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

// Check task reminders
function checkTaskReminders() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    tasks.forEach(task => {
        if (!task.completed && task.startTime === currentTime) {
            triggerReminder(task);
        }
    });
}

// Trigger reminder
function triggerReminder(task) {
    if (task.reminderCount >= 3) return;
    
    task.reminderCount++;
    saveTasks();
    renderTaskList();
    
    // Show notification
    showBrowserNotification(task.name, task.startTime);
    showToast(`⏰ Time for: "${task.name}". Please complete it!`);
    
    // Remind again after 5 minutes
    if (task.reminderCount < 3 && !task.completed) {
        setTimeout(() => {
            if (!task.completed) {
                triggerReminder(task);
            }
        }, 300000); // 5 minutes
    }
}

// Browser notification
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

function showBrowserNotification(taskName, time) {
    if (Notification.permission === 'granted') {
        new Notification('⏰ Smart Reminder', {
            body: `Time to start: ${taskName} (${time})`,
            icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
            vibrate: [200, 100, 200],
            badge: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png'
        });
    }
}

// Toast message
function showToast(message) {
    const statusDiv = document.getElementById('notificationStatus');
    if (!statusDiv) return;
    
    const toast = document.createElement('div');
    toast.className = 'notif-toast';
    toast.innerHTML = message;
    statusDiv.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function clearReminders(task) {
    task.reminderCount = 3;
    saveTasks();
    renderTaskList();
}

// End of day evaluation
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

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Start timers
function startTimers() {
    updateCurrentTime();
    setInterval(() => {
        updateCurrentTime();
        checkTaskReminders();
        checkEndOfDay();
    }, 1000); // Check every second
}

// PWA Service Worker registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker registered:', reg))
            .catch(err => console.log('❌ Service Worker failed:', err));
    }
}

// App install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const installBtn = document.createElement('button');
    installBtn.textContent = '📲 Install App';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '10px';
    installBtn.style.left = '10px';
    installBtn.style.zIndex = '1000';
    installBtn.style.background = '#4F46E5';
    installBtn.style.color = 'white';
    installBtn.style.border = 'none';
    installBtn.style.padding = '10px 15px';
    installBtn.style.borderRadius = '25px';
    installBtn.style.fontSize = '12px';
    installBtn.style.cursor = 'pointer';
    
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

// Initialize app
function init() {
    render();
    requestNotificationPermission();
    startTimers();
    registerServiceWorker();
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);
