import { useState } from "react";
import "../styles/styles.css"

type NavItem = {
  label: string;
  icon: string;
  badge?: string;
};

const mainNav: NavItem[] = [
  { label: "Dashboard", icon: "ti-home" },
  { label: "Info", icon: "ti-report-medical" },
  { label: "TBA", icon: "ti-report-medical" },
  { label: "TBA", icon: "ti-report-medical" },
  
];

const settingsNav: NavItem[] = [
  { label: "Settings", icon: "ti-settings" },
];

export default function SidebarComponent() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div className="sidebar-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">
            <i className="ti ti-layout-sidebar sidebar-logo-icon" />
            <span>Medycist</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <SectionLabel label="Main" />
          {mainNav.map((item) => (
            <NavItemRow
              key={item.label}
              item={item}
              active={activePage === item.label}
              onClick={() => setActivePage(item.label)}
            />
          ))}

          <SectionLabel label="Settings" />
          {settingsNav.map((item) => (
            <NavItemRow
              key={item.label}
              item={item}
              active={activePage === item.label}
              onClick={() => setActivePage(item.label)}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <div className="user-avatar">
              JD
            </div>
            <div className="user-info">
              <p className="user-name">Jamie Doe</p>
              <p className="user-role">Admin</p>
            </div>
            <i className="ti ti-dots user-menu-icon" />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <h1 className="main-title">{activePage}</h1>
        <p className="main-subtitle">Welcome back, Jamie.</p>
        <div className="dashboard-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid-item" />
          ))}
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="section-label">
      {label}
    </p>
  );
}

function NavItemRow({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`nav-item ${active ? "active" : ""}`}
    >
      <i className={`ti ${item.icon} nav-item-icon`} aria-hidden="true" />
      <span>{item.label}</span>
      {item.badge && (
        <span className="nav-item-badge">
          {item.badge}
        </span>
      )}
    </button>
  );
}
