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
const MAX_POLL_ATTEMPTS = 15


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
    if (correlationIdRef.current) {
      fetch('/api/biometria/login/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correlationId: correlationIdRef.current }),
      }).catch(() => {})
    }
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
            correlationIdRef.current = null
            setUserData({
              userId: statusData.userId,
              nome: statusData.nome,
              email: statusData.email,
            })
            setStatus('sucesso')
            setMensagem(`Bem-vindo, ${statusData.nome}!`)
          } else if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
            pararPolling()
            correlationIdRef.current = null
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

  useEffect(() => {
    return () => pararPolling()
  }, [pararPolling])

  return { status, mensagem, userData, iniciarLoginBiometria, cancelar }
}


export function useBiometriaRegisto(): UseBiometriaRegistoResult {
  const [status, setStatus] = useState<BiometriaStatus>('idle')
  const [mensagem, setMensagem] = useState('')
  const statusRef = useRef<BiometriaStatus>('idle')
  const userIdRef = useRef<number | null>(null)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const cancelar = useCallback(() => {
    if (userIdRef.current !== null) {
      fetch('/api/biometria/registar/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdRef.current }),
      }).catch(() => {})
    }
    userIdRef.current = null
    setStatus('idle')
    setMensagem('')
  }, [])

  const iniciarRegisto = useCallback(async (userId: number) => {
    if (statusRef.current === 'aguardar_dedo' || statusRef.current === 'a_processar') {
      return
    }

    userIdRef.current = userId
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
    } finally {
      userIdRef.current = null
    }
  }, [])

  return { status, mensagem, iniciarRegisto, cancelar }
}