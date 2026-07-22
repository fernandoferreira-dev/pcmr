import { create } from 'zustand';

//const API_URL = 'http://localhost:8080';
const POLL_INTERVAL_MS = 4000;

export interface NotificationItem {
  id: string;
  titulo: string;
  corpo: string;
  createdAt: string;
}

interface AlertaResumo {
  idAlerta: number;
  tipoAlerta: string;
  valorRegistado: number;
  mensagem: string;
  dataHora: string;
}

interface MensagemResumo {
  idMensagem: number;
  nomeRemetente: string;
  assunto: string;
  corpo: string;
  dataEnvio: string;
}

function tituloAlerta(tipoAlerta: string): string {
  switch (tipoAlerta) {
    case 'TEMPERATURA_ALTA':
      return 'Temperatura elevada';
    case 'TEMPERATURA_BAIXA':
      return 'Temperatura baixa';
    case 'BPM_ALTO':
      return 'Frequência cardíaca elevada';
    case 'BPM_BAIXO':
      return 'Frequência cardíaca baixa';
    case 'QUEDA':
      return 'Possível queda detetada';
    default:
      return tipoAlerta;
  }
}

function paraNotificationItem(a: AlertaResumo): NotificationItem {
  return {
    id: `alerta-${a.idAlerta}`,
    titulo: tituloAlerta(a.tipoAlerta),
    corpo: a.mensagem,
    createdAt: a.dataHora,
  };
}

function mensagemParaNotificationItem(m: MensagemResumo): NotificationItem {
  return {
    id: `mensagem-${m.idMensagem}`,
    titulo: m.nomeRemetente,
    corpo: m.assunto || m.corpo,
    createdAt: m.dataEnvio,
  };
}

interface NotificationState {
  notifications: NotificationItem[];
  activeToast: NotificationItem | null;
  fetchHistory: (userId?: number | null) => Promise<void>;
  connect: () => void;
  disconnect: () => void;
  dismissToast: () => void;
  playAlertSound: () => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let ultimoIdConhecido: number | null = null;
let primeiraVerificacao = true;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  activeToast: null,

  fetchHistory: async (userId) => {
    try {
      //const pedidos: Promise<Response>[] = [fetch(`${API_URL}/api/alertas/recentes?limite=10`)];
      const pedidos: Promise<Response>[] = [fetch(`/api/alertas/recentes?limite=10`)];
      if (userId) {
        //pedidos.push(fetch(`${API_URL}/api/mensagens/recebidas?userId=${userId}`));
        pedidos.push(fetch(`/api/mensagens/recebidas?userId=${userId}`));
      }

      const respostas = await Promise.all(pedidos);
      const alertas: AlertaResumo[] = respostas[0].ok ? await respostas[0].json() : [];
      const mensagens: MensagemResumo[] = respostas[1] && respostas[1].ok ? await respostas[1].json() : [];

      const itens = [
        ...alertas.map(paraNotificationItem),
        ...mensagens.map(mensagemParaNotificationItem),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      set({ notifications: itens });
      if (alertas.length > 0) {
        ultimoIdConhecido = alertas[0].idAlerta;
      }
    } catch {
      // sem histórico disponível, a app continua a funcionar com o que chegar a seguir
    }
  },

  connect: () => {
    if (pollTimer) return;

    const verificar = async () => {
      try {
        //const res = await fetch(`${API_URL}/api/alertas/recentes?limite=1`);
        const res = await fetch(`/api/alertas/recentes?limite=1`);
        if (!res.ok) return;
        const data: AlertaResumo[] = await res.json();
        if (data.length === 0) return;

        const maisRecente = data[0];

        if (primeiraVerificacao) {
          primeiraVerificacao = false;
          ultimoIdConhecido = maisRecente.idAlerta;
          return;
        }

        if (maisRecente.idAlerta !== ultimoIdConhecido) {
          ultimoIdConhecido = maisRecente.idAlerta;
          const item = paraNotificationItem(maisRecente);
          set((state) => ({
            notifications: [item, ...state.notifications],
            activeToast: item,
          }));
          get().playAlertSound();
        }
      } catch {
        // falha silenciosa; não interrompe o polling seguinte
      }
    };

    verificar();
    pollTimer = setInterval(verificar, POLL_INTERVAL_MS);
  },

  disconnect: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },

  dismissToast: () => set({ activeToast: null }),

  playAlertSound: () => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();

      const beeps = 2;
      const frequency = 880;
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
      // se o browser bloquear o AudioContext, ignora silenciosamente
    }
  },
}));