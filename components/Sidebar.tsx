// ============================================================
// AstroVault — Sidebar Navigation
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: "Overview",
    links: [
      { href: "/dashboard", icon: "◈", label: "Dashboard" },
    ],
  },
  {
    label: "Operations",
    links: [
      { href: "/red-team", icon: "⚔", label: "Red Team" },
      { href: "/blue-team", icon: "🛡", label: "Blue Team" },
    ],
  },
  {
    label: "Intelligence",
    links: [
      { href: "/threats", icon: "⚠", label: "Threat Logs" },
      { href: "/sessions", icon: "◎", label: "Sessions" },
      { href: "/audit", icon: "⛓", label: "Audit Chain" },
    ],
  },
  {
    label: "Infrastructure",
    links: [
      { href: "/system", icon: "▣", label: "System Health" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: "18px" }}>◆</span>
        <div>
          <h1>AstroVault</h1>
        </div>
        <span className="logo-badge">Live</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-label">{section.label}</div>
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link ${pathname === link.href ? "active" : ""}`}
              >
                <span className="icon">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: 4 }}>AstroVault v1.0.0</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
          AI Safety Validation Platform
        </div>
      </div>
    </aside>
  );
}
