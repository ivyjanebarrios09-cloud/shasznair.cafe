import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from './config';
import { UserProfile } from '../types';

let messagingInstance: any = null;

export const getFirebaseMessaging = async () => {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
};

export type NotificationSoundType = 'classic_bell' | 'espresso_ding' | 'digital_chime' | 'urgent_pulse' | 'gentle_marimba';

export interface SoundOption {
  id: NotificationSoundType;
  name: string;
  description: string;
  badge: string;
}

export const NOTIFICATION_SOUNDS: SoundOption[] = [
  { id: 'classic_bell', name: 'Classic Gold Bell', description: 'Harmonic warm cafe bell arpeggio', badge: 'Popular' },
  { id: 'espresso_ding', name: 'Espresso Brass Ding', description: 'Deep resonant counter service bell', badge: 'Crisp' },
  { id: 'digital_chime', name: 'Digital Register Chime', description: 'Modern two-tone POS cashier electronic chime', badge: 'Modern' },
  { id: 'urgent_pulse', name: 'Urgent Rush Alert', description: 'Fast repeating tri-tone pulse for busy rush hours', badge: 'Loud' },
  { id: 'gentle_marimba', name: 'Gentle Lounge Marimba', description: 'Soft acoustic wooden notes for relaxed ambience', badge: 'Soft' }
];

export const getSavedNotificationSound = (): NotificationSoundType => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('coffee_notification_sound') as NotificationSoundType;
    if (saved && NOTIFICATION_SOUNDS.some(s => s.id === saved)) {
      return saved;
    }
  }
  return 'classic_bell';
};

export const getSavedNotificationVolume = (): number => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('coffee_notification_volume');
    if (saved !== null) {
      const vol = parseFloat(saved);
      if (!isNaN(vol) && vol >= 0 && vol <= 1) return vol;
    }
  }
  return 0.85; // Default 85%
};

export const setSavedNotificationSound = (sound: NotificationSoundType) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('coffee_notification_sound', sound);
  }
};

export const setSavedNotificationVolume = (volume: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('coffee_notification_volume', String(Math.max(0, Math.min(1, volume))));
  }
};

// Play a distinct cafe chime sound using Web Audio API with sound presets & volume control
export const playOrderChime = (customSound?: NotificationSoundType, customVolume?: number) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const sound = customSound || getSavedNotificationSound();
    const volume = customVolume !== undefined ? Math.max(0, Math.min(1, customVolume)) : getSavedNotificationVolume();

    if (volume <= 0) return; // Muted

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (sound === 'classic_bell') {
      // Warm 4-note arpeggio (E5 -> G#5 -> B5 -> E6)
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.09);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.09);
        gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + index * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.09 + 0.65);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(ctx.currentTime + index * 0.09);
        osc.stop(ctx.currentTime + index * 0.09 + 0.75);
      });
    } else if (sound === 'espresso_ding') {
      // Resonant brass bell ding (fundamental + octave harmonic)
      const freqs = [880, 1760, 2640];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const amp = idx === 0 ? 0.8 : 0.35 / idx;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(amp, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
      });
    } else if (sound === 'digital_chime') {
      // Modern high-tech 2-tone register chime (C6 -> G6)
      const tones = [1046.50, 1567.98];
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.75, ctx.currentTime + idx * 0.12 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.45);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.5);
      });
    } else if (sound === 'urgent_pulse') {
      // 3 fast urgent pings (A5 -> C#6 -> E6)
      const pulses = [880, 1108.73, 1318.51, 1318.51];
      pulses.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + idx * 0.07 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.07 + 0.3);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.35);
      });
    } else if (sound === 'gentle_marimba') {
      // Warm acoustic wooden marimba chord (G4 -> C5 -> E5 -> G5)
      const notes = [392.00, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + idx * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
    }

    // Also trigger mobile device vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
  } catch (err) {
    console.warn('[Audio] Could not synthesize chime:', err);
  }
};

// Request notification permission and register FCM device token in Firestore
export const requestFcmToken = async (currentUser?: UserProfile | null): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Push notifications are not supported in this browser.' };
    }

    if (!('serviceWorker' in navigator)) {
      return { success: false, error: 'Service workers are not supported in this browser.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: `Notification permission ${permission}. Please allow notifications in site settings.` };
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return { success: false, error: 'Firebase Cloud Messaging is not supported in this environment.' };
    }

    // Ensure service worker is registered
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is not set in environment variables.');
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { success: false, error: 'No FCM registration token received.' };
    }

    // Store / update token in Firestore `fcm_tokens` collection
    // Use a sanitized token string as doc ID
    const tokenDocId = btoa(token.slice(-32)).replace(/[/+=]/g, '_');
    const tokenRef = doc(db, 'fcm_tokens', tokenDocId);
    
    await setDoc(tokenRef, {
      token,
      uid: currentUser?.uid || 'anonymous_staff',
      role: currentUser?.role || 'cashier',
      name: currentUser?.name || 'Cashier Register',
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'web',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    // Store in localStorage for quick client-side reference
    localStorage.setItem('shasznair_fcm_token', token);
    console.log('[FCM] Successfully registered device token for POS alerts:', token);

    return { success: true, token };
  } catch (err: any) {
    console.error('[FCM] Error requesting FCM token:', err);
    return { success: false, error: err.message || 'Failed to register notification token' };
  }
};

// Unregister device token
export const unregisterFcmToken = async (): Promise<boolean> => {
  try {
    const savedToken = localStorage.getItem('shasznair_fcm_token');
    if (savedToken && db) {
      const tokenDocId = btoa(savedToken.slice(-32)).replace(/[/+=]/g, '_');
      await deleteDoc(doc(db, 'fcm_tokens', tokenDocId));
    }
    localStorage.removeItem('shasznair_fcm_token');
    return true;
  } catch (err) {
    console.error('[FCM] Error unregistering token:', err);
    return false;
  }
};

// Initialize foreground message listener
export const setupForegroundFCMListener = async (onNewOrderMessage?: (payload: any) => void) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground notification received:', payload);
    
    // Play chime sound & vibrate
    playOrderChime();

    if (onNewOrderMessage) {
      onNewOrderMessage(payload);
    }

    // If browser supports notifications and permission is granted, also show system banner
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = payload.notification?.title || payload.data?.title || '🔔 New Order Received!';
        const body = payload.notification?.body || payload.data?.body || 'A new order has been placed in the cashier register.';
        
        new Notification(title, {
          body,
          icon: '/coffee_logo.jpg',
          badge: '/coffee_logo.jpg',
          tag: payload.data?.orderNumber ? `order-${payload.data.orderNumber}` : 'pos-order',
        });
      } catch (e) {
        // Ignored if window notification is restricted
      }
    }
  });

  return unsubscribe;
};
