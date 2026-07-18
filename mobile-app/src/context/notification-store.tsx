import { create } from 'zustand';

const API_URL = 'http://localhost:8080';
const WS_URL = `${API_URL.replace(/^http/, 'ws')}/ws/notifications`;

export type Severidade = 'INFO' | 'WARNING' | 'CRITICAL';

export interface NotificationItem {
  id: number;
  titulo: string;
  corpo: string;
  origem: string | null;
  severidade: Severidade;
  createdAt: string;
  lida: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  activeToast: NotificationItem | null;
  connected: boolean;

  fetchHistory: () => Promise<void>;
  connect: () => void;
  disconnect: () => void;
  markAsRead: (id: number) => Promise<void>;
  dismissToast: () => void;
  playAlertSound: (severidade: Severidade) => void;
}

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  activeToast: null,
  connected: false,


  fetchHistory: async () => {
    try {
      const res = await fetch(`${API_URL}/api/notificacoes`);
      if (!res.ok) return;
      const data: NotificationItem[] = await res.json();
      set({ notifications: data });
    } catch {
    }
  },

  
  connect: () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      socket = new WebSocket(WS_URL);
    } catch {
      return;
    }

    socket.onopen = () => {
      set({ connected: true });
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const nova: NotificationItem = JSON.parse(event.data);
        set((state) => ({
          notifications: [nova, ...state.notifications],
          activeToast: nova,
        }));
        get().playAlertSound(nova.severidade);
      } catch {
      
      }
    };

    socket.onclose = () => {
      set({ connected: false });
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          get().connect();
        }, 3000);
      }
    };

    socket.onerror = () => {
      socket?.close();
    };
  },

  disconnect: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    socket?.close();
    socket = null;
    set({ connected: false });
  },

  markAsRead: async (id: number) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, lida: true } : n)),
    }));

    try {
      await fetch(`${API_URL}/api/notificacoes/${id}/lida`, { method: 'PATCH' });
    } catch {
    }
  },

  dismissToast: () => set({ activeToast: null }),

  playAlertSound: (severidade: Severidade) => {
    if (severidade === 'INFO') return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();

      const beeps = severidade === 'CRITICAL' ? 3 : 2;
      const frequency = severidade === 'CRITICAL' ? 1046.5 : 784;
      const beepDuration = 0.15;
      const gap = 0.12;

      for (let i = 0; i < beeps; i++) {
        const startTime = ctx.currentTime + i * (beepDuration + gap);
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + beepDuration);
      }

      setTimeout(() => ctx.close(), (beeps * (beepDuration + gap) + 0.2) * 1000);
    } catch {
    }
  },
}));