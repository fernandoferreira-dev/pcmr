import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
    en: {
        translation: {
            dashboard: {
                title: 'Dashboard',
                welcome: 'Welcome, {{name}}',
                quickConsultationButton: 'Quick Consultation',
                serverStatus: 'Server status:',
                nodeSensorStatus: 'Node sensor status:',
                latestNotifications: 'Latest notifications:',
            },
            personalData: {
                title: 'Personal Data',
                username: 'Username',
                phoneNumber: 'Phone Number',
                email: 'Email:',
                accountSummary: 'Account Summary',
                status: 'Status:',
                statusActive: 'Active',
                dateOfBirth: 'Date of Birth:',
                languagePreference: 'Language Preference',
            },
            diagnostics: {
                title: 'Diagnostic Data',
                diagnosticsCount: 'Number of Diagnostics:',
                usersCount: 'Number of users',
                filterPlaceholder: 'Filter consultations...',
                updateButton: 'Update',
                historyTitle: 'Diagnostics History',
                tablePatient: 'Patient',
                tableTime: 'Time',
                tableObs: 'Observations',
                tableCause: 'Cause-effect',
                exportButton: 'Export',
            },
            equipment: {
                title: 'Equipment Data',
                connection: 'Connection',
                testConnectionButton: 'Test Connection',
                searchPlaceholder: 'Search by name...',
                status: 'Status: {{value}}',
                equipmentName: 'Equipment name:',
                lastReading: 'Last reading:',
            },
            communication: {
                title: 'Communication',
                searchPlaceholder: 'Search messages',
                filterBy: 'Filter by:',
                sent: 'Sent',
                received: 'Received',
                receiver: 'Receiver',
                all: 'All',
                saved: 'Saved',
                subject: 'Subject:',
                body: 'Body:',
            },
            settings: {
                iconAlt: 'Settings',
                title: 'Settings',
                darkMode: 'Dark Mode',
                languagePreference: 'Language Preference',
                logOut: 'Log Out',
            },
            general: {
                error: 'Error',
                loading: 'Loading...',
                diagNotFound: 'No diagnostics found',
            }
        },
    },
    pt: {
        translation: {
            dashboard: {
                title: 'Dashboard',
                welcome: 'Bem vindo, {{name}}',
                quickConsultationButton: 'Consulta Rápida',
                serverStatus: 'Estado do servidor:',
                nodeSensorStatus: 'Estado do sensor nó:',
                latestNotifications: 'Ultimas notificações:',
            },
            personalData: {
                title: 'Dados Pessoais',
                username: 'Nome de utilizador',
                phoneNumber: 'Número de Telemóvel',
                email: 'Email:',
                accountSummary: 'Resumo da conta',
                status: 'Estado:',
                statusActive: 'Ativo',
                dateOfBirth: 'Data de Nascimento:',
                languagePreference: 'Preferência de Idioma',
            },
            diagnostics: {
                title: 'Dados Diagnósticos',
                diagnosticsCount: 'Quantidade de Diagnósticos:',
                usersCount: 'Quantidade de utilizadores',
                filterPlaceholder: 'Filtrar consultas...',
                updateButton: 'Atualizar',
                historyTitle: 'Histórico de Diagnósticos',
                tablePatient: 'Paciente',
                tableTime: 'Horário',
                tableObs: 'Observações',
                tableCause: 'Causa-efeito',
                exportButton: 'Exportar',
            },
            equipment: {
                title: 'Dados de Equipamentos',
                connection: 'Conexão',
                testConnectionButton: 'Testar Conexão',
                searchPlaceholder: 'Pesquisar por nome...',
                status: 'Estado:',
                equipmentName: 'Nome do equipamento:',
                lastReading: 'Ultima leitura:',
            },
            communication: {
                title: 'Comunicação',
                searchPlaceholder: 'Pesquisar mensagens',
                filterBy: 'Filtrar por:',
                sent: 'Enviadas',
                received: 'Recebidas',
                receiver: 'Destinatário',
                all: 'Todas',
                saved: 'Guardadas',
                subject: 'Assunto:',
                body: 'Corpo:',
            },
            settings: {
                iconAlt: 'Definições',
                title: 'Definições',
                darkMode: 'Modo Escuro',
                languagePreference: 'Preferência de Linguagem',
                logOut: 'Terminar Sessão',
            },
            general: {
                error: 'Erro',
                loading: 'A carregar...',
                diagNotFound: 'Nenhum diagnóstico encontrado',
            }
        },
    },
} as const;

const savedLanguage = localStorage.getItem('language');

i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage ?? 'pt',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

export default i18n;