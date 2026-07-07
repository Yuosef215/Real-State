import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, Users, FileText, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard, end: true },
  { to: "/properties", label: "العقارات", icon: Building2 },
  { to: "/tenants", label: "المستأجرين", icon: Users },
  { to: "/contracts", label: "العقود", icon: FileText },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="app-shell">
      {/* Sidebar — desktop only (hidden under 860px via CSS) */}
      <aside className="sidebar">
        <div className="sidebar-brand">إدارة العقارات</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
        <button className="nav-item" style={{ marginTop: "auto" }} onClick={logout}>
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom tab bar — mobile only (shown under 860px via CSS) */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
