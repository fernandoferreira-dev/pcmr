import { useState } from 'react'
import AdminDashboardComponent from '../components/dashboard/admin-dashboard-component'
import NavBarComponent from '../components/misc/nav-bar-component'
import ContactPage from './contact-page'
import StatusPage from './status-page'
import InfoPage from './info-page'
import ClientInfoPage from './client-info-page'

export default function MainPage() {
    const [view, setView] = useState<'home' | 'contact' | 'status' | 'doctor' | 'records'>('home')

    const renderView = () => {
        switch (view) {
            case 'contact':
                return <ContactPage/>
            case 'status':
                return <StatusPage/>
            case 'doctor':
                return <InfoPage/>
            case 'records':
                return <ClientInfoPage/>
            default:
                return <AdminDashboardComponent/>
        }
    }

    return (
        <>
            {renderView()}
            <NavBarComponent onNavigate={setView} />
        </>
    )
}
