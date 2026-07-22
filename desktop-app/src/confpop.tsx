import { useState } from 'react';
import sair from './assets/imagens/exit (1).png';
import { useTranslation } from 'react-i18next';

type ConfPopProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export default function ConfPop({ isOpen, onClose, onLogout }: ConfPopProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('Português');
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value; // "pt" or "en"
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-[380px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Modo Escuro</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#8CA483] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8CA483]"></div>
            </label>
          </div>

          <hr className="border-gray-100" />

          {/* Language Preference */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Preferência de Lingua</span>
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-gray-100 border border-gray-200 text-gray-700 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA483] cursor-pointer"
            >
              <option value="Português">Português</option>
              <option value="English">Inglês</option>
            </select>
          </div>

          <hr className="border-gray-100" />

          {/* Log Out */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3.5 rounded-2xl transition-colors cursor-pointer"
          >
            <img src={sair} alt="Sair" className="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}