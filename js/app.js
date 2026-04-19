// Notification function for PWA
function showBrowserNotification(taskName, time) {
  // Check if service worker is registered
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Send notification through service worker
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('⏰ Smart Reminder', {
        body: `Time to start: ${taskName} (${time})`,
        icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
        vibrate: [200, 100, 200],
        tag: 'reminder',
        requireInteraction: true  // Notification stays until user clicks
      });
    });
  } 
  // Fallback for browsers without service worker
  else if (Notification.permission === 'granted') {
    new Notification('⏰ Smart Reminder', {
      body: `Time to start: ${taskName} (${time})`,
      icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
      vibrate: [200, 100, 200]
    });
  }
}

// Check if app is installed
function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Show install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
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
