import { useState, type JSX } from "react";
import '../../styles/navbar-styles/navbar-styles.css';

type NavItemId = 'contact' | 'status' | 'home' | 'doctor' | 'records';

interface IconProps {
  active: boolean;
}

interface NavItem {
  id: NavItemId;
  label: string;
  icon: (props: IconProps) => JSX.Element;
}

interface NavBarProps {
  onNavigate?: (id: NavItemId) => void;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "contact",
    label: "Contact",
    icon: ({ active }: IconProps) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" width={26} height={26}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.8 11.6 19.79 19.79 0 0 1 1.72 3 2 2 0 0 1 3.7 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.7a16 16 0 0 0 6 6l1.06-1.06a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 15.92z" />
      </svg>
    ),
  },
  {
    id: "status",
    label: "Status",
    icon: ({ active }: IconProps) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" width={26} height={26}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "home",
    label: "Home",
    icon: ({ active }: IconProps) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} fill="none" />
      </svg>
    ),
  },
  {
    id: "doctor",
    label: "Doctor",
    icon: ({ active }: IconProps) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" width={26} height={26}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <line x1="12" y1="13" x2="12" y2="17" />
        <line x1="10" y1="15" x2="14" y2="15" />
      </svg>
    ),
  },
  {
    id: "records",
    label: "Records",
    icon: ({ active }: IconProps) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" width={26} height={26}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="15" y2="11" />
        <line x1="9" y1="15" x2="13" y2="15" />
        <circle cx="16" cy="8" r="3" fill="none" />
        <path d="M13.5 8h5M16 5.5v5" stroke="currentColor" strokeWidth={1.4} />
      </svg>
    ),
  },
];

const CREATORS = "© 2026 Diogo Rocha - Fernando Ferreira - Jaime Quaresma - João Santos";

export default function NavBarComponent({ onNavigate }: NavBarProps) {
  const [active, setActive] = useState<NavItemId>("home");

  const handleSelect = (id: NavItemId) => {
    setActive(id);
    onNavigate?.(id);
  };

  return (
    <nav className="navwrapper">
      <div className="navbar">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`navbtn ${isActive ? "active" : ""}`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="naviconWrap">
                <item.icon active={isActive} />
                {isActive && <span className="navdot" />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="navfooter">{CREATORS}</div>
    </nav>
  );
}


