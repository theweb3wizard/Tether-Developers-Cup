export function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notificaciones no soportadas');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  Notification.requestPermission();
  return false;
}

export function sendNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/IMG/hero-icon.png',
  });
}
