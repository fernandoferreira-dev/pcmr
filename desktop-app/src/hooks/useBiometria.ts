import { useState, useRef, useCallback, useEffect } from 'react'

type BiometriaStatus =
  | 'idle'
  | 'aguardar_dedo'
  | 'a_processar'
  | 'sucesso'
  | 'erro'
  | 'timeout'

interface UseBiometriaLoginResult {
  status: BiometriaStatus
  mensagem: string
  userData: { userId: number; nome: string; email: string } | null
  iniciarLoginBiometria: () => void
  cancelar: () => void
}

interface UseBiometriaRegistoResult {
  status: BiometriaStatus
  mensagem: string
  iniciarRegisto: (userId: number) => void
  cancelar: () => void
}

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 15 // 30 segundos

/**
 * Hook para login por impressão digital.
 * Faz polling do endpoint /api/biometria/login/status
 * até obter "autenticado" ou timeout.
 */
export function useBiometriaLogin(): UseBiometriaLoginResult {
  const [status, setStatus] = useState<BiometriaStatus>('idle')
  const [mensagem, setMensagem] = useState('')
  const [userData, setUserData] = useState<{ userId: number; nome: string; email: string } | null>(null)
  const correlationIdRef = useRef<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef = useRef(0)

  const pararPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const cancelar = useCallback(() => {
    pararPolling()
    correlationIdRef.current = null
    attemptsRef.current = 0
    setStatus('idle')
    setMensagem('')
  }, [pararPolling])

  const iniciarLoginBiometria = useCallback(async () => {
    cancelar()
    setStatus('aguardar_dedo')
    setMensagem('Coloque o dedo no sensor de impressão digital...')

    try {
      const res = await fetch('/api/biometria/login/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        setStatus('erro')
        setMensagem('Erro ao contactar o servidor')
        return
      }

      const data = await res.json()
      correlationIdRef.current = data.correlationId
      attemptsRef.current = 0

      // Iniciar polling
      pollingRef.current = setInterval(async () => {
        if (!correlationIdRef.current) {
          pararPolling()
          return
        }

        attemptsRef.current++

        try {
          const statusRes = await fetch(
            `/api/biometria/login/status?correlationId=${correlationIdRef.current}`
          )
          const statusData = await statusRes.json()

          if (statusData.status === 'autenticado') {
            pararPolling()
            setUserData({
              userId: statusData.userId,
              nome: statusData.nome,
              email: statusData.email,
            })
            setStatus('sucesso')
            setMensagem(`Bem-vindo, ${statusData.nome}!`)
          } else if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
            pararPolling()
            setStatus('timeout')
            setMensagem('Tempo excedido. Tente novamente.')
          }
        } catch {
          pararPolling()
          setStatus('erro')
          setMensagem('Erro de comunicação com o servidor')
        }
      }, POLL_INTERVAL_MS)
    } catch {
      setStatus('erro')
      setMensagem('Erro ao contactar o servidor')
    }
  }, [cancelar, pararPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => pararPolling()
  }, [pararPolling])

  return { status, mensagem, userData, iniciarLoginBiometria, cancelar }
}

/**
 * Hook para registo de impressão digital.
 * Envia pedido ao backend que fica bloqueado até o ESP32 responder.
 */
export function useBiometriaRegisto(): UseBiometriaRegistoResult {
  const [status, setStatus] = useState<BiometriaStatus>('idle')
  const [mensagem, setMensagem] = useState('')

  const cancelar = useCallback(() => {
    setStatus('idle')
    setMensagem('')
  }, [])

  const iniciarRegisto = useCallback(async (userId: number) => {
    setStatus('aguardar_dedo')
    setMensagem('Coloque o dedo no sensor de impressão digital para registo...')

    try {
      const res = await fetch('/api/biometria/registar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json()

      if (res.ok && data.sucesso) {
        setStatus('sucesso')
        setMensagem(data.mensagem || 'Impressão digital registada com sucesso!')
      } else {
        setStatus('erro')
        setMensagem(data.mensagem || 'Falha ao registar impressão digital.')
      }
    } catch {
      setStatus('erro')
      setMensagem('Erro de comunicação com o servidor')
    }
  }, [])

  return { status, mensagem, iniciarRegisto, cancelar }
}
