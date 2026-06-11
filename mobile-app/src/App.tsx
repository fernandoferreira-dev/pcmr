import { useState } from 'react'
import LoginPage from './pages/login-page'
import SidebarComponent from './components/side-bar-component'

function App() {
  const [page, setPage] = useState<'login' | 'dashboard'>('login')

  return page === 'login' ? (
    <LoginPage onLogin={() => setPage('dashboard')}/>
  ) : (
    <SidebarComponent />
  )
}

export default App