import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Home,
  Users,
  Clock,
  DollarSign,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
} from "lucide-react";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef();
  const profileRef = useRef();
  const navigate = useNavigate();

  // 🧠 Load user info from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 🌙 Dark Mode Effect
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#1e293b" : "#f9fafc";
    document.body.style.color = darkMode ? "#e2e8f0" : "#111";
  }, [darkMode]);

  // 🔔 Fetch Notifications dynamically
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/notifications");
        const data = await res.json();
        setNotifications(data || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  // 🧩 Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🚪 Logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  // 🧭 Dynamic Sidebar Items (based on role)
  const role = user?.role || "employee";
  const navItems =
    role === "admin"
      ? [
          { path: "/", label: "Dashboard", icon: Home },
          { path: "/employees", label: "Employees", icon: Users },
          { path: "/work-records", label: "Work Records", icon: Clock },
          { path: "/payroll", label: "Payroll", icon: DollarSign },
          { path: "/invoices", label: "Invoices", icon: FileText },
          { path: "/settings", label: "Settings", icon: Settings },
        ]
      : [
          { path: "/work-records", label: "Work Records", icon: Clock },
          { path: "/payroll", label: "Payroll", icon: DollarSign },
          { path: "/settings", label: "Settings", icon: Settings },
        ];

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <aside
        style={{
          ...sidebarStyle,
          width: collapsed ? "70px" : "220px",
          background: darkMode ? "#334155" : "#fff",
          color: darkMode ? "#f8fafc" : "#000",
        }}
      >
        <div style={logoSection}>
          <h2 style={{ fontSize: "1.2rem" }}>
            {!collapsed ? "💼 PayrollSys" : "💼"}
          </h2>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={toggleBtn}
            title="Toggle Sidebar"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <nav style={navStyle}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...navItem,
                backgroundColor: isActive
                  ? darkMode
                    ? "#475569"
                    : "#e3f2fd"
                  : "transparent",
                color: isActive ? "#1976d2" : darkMode ? "#f8fafc" : "#333",
              })}
            >
              <item.icon size={18} />
              {!collapsed && (
                <span style={{ marginLeft: 10 }}>{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Section */}
      <div style={mainWrapper}>
        {/* Top Navbar */}
        <header
          style={{
            ...topBar,
            background: darkMode ? "#1e293b" : "#fff",
            color: darkMode ? "#f8fafc" : "#000",
          }}
        >
          <div style={leftTop}>
            <h3>
              Welcome,{" "}
              {user ? (
                <>
                  {user.name}{" "}
                  <span style={{ fontSize: "0.9rem", color: "#888" }}>
                    ({user.role})
                  </span>
                </>
              ) : (
                "User"
              )}
            </h3>
          </div>

          <div style={rightTop}>
            {/* 🔔 Notifications Dropdown */}
            <div
              style={{ position: "relative", marginRight: "20px" }}
              ref={notifRef}
            >
              <button
                style={iconBtn}
                onClick={() => setNotifOpen(!notifOpen)}
                title="Notifications"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span style={notifDot}>{notifications.length}</span>
                )}
              </button>

              {notifOpen && (
                <div
                  style={{
                    ...dropdownBox,
                    background: darkMode ? "#334155" : "#fff",
                    color: darkMode ? "#f8fafc" : "#000",
                  }}
                >
                  <h4 style={dropdownTitle}>Notifications</h4>
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n._id} style={notifItem}>
                        <p style={{ margin: 0 }}>{n.message}</p>
                        <small style={{ color: "#888" }}>
                          {new Date(n.createdAt).toLocaleString()}
                        </small>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#888", margin: "5px 0" }}>
                      No new notifications
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 🌙 Dark Mode Toggle */}
            <button onClick={() => setDarkMode(!darkMode)} style={iconBtn}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* 👤 Profile Dropdown */}
            <div style={{ position: "relative" }} ref={profileRef}>
              <button
                style={profileBox}
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <User size={20} />
                <span style={{ marginLeft: 8 }}>
                  {user ? user.name : "User"}
                </span>
              </button>

              {profileOpen && (
                <div
                  style={{
                    ...dropdownBox,
                    background: darkMode ? "#334155" : "#fff",
                  }}
                >
                  <p
                    style={dropdownItem}
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/settings");
                    }}
                  >
                    👤 View Profile
                  </p>
                  <p style={dropdownItem} onClick={handleLogout}>
                    <LogOut size={16} style={{ marginRight: 8 }} /> Logout
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/* --- Styles --- */
const containerStyle = { display: "flex", height: "100vh", overflow: "hidden" };
const sidebarStyle = {
  boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  padding: "15px 10px",
  transition: "width 0.3s ease",
};
const logoSection = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "25px",
  padding: "0 8px",
};
const toggleBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#333",
};
const navStyle = { display: "flex", flexDirection: "column", gap: "8px" };
const navItem = {
  display: "flex",
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: "8px",
  fontWeight: "500",
  textDecoration: "none",
  transition: "background-color 0.2s ease",
};
const mainWrapper = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  height: "100vh",
};
const topBar = {
  height: "60px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 25px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  position: "relative",
  zIndex: 2,
};
const leftTop = { fontWeight: "600", fontSize: "1.1rem" };
const rightTop = { display: "flex", alignItems: "center", position: "relative" };
const iconBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  marginRight: "20px",
  color: "inherit",
  position: "relative",
};
const notifDot = {
  position: "absolute",
  top: "-5px",
  right: "-8px",
  background: "#f44336",
  color: "white",
  borderRadius: "50%",
  fontSize: "0.7rem",
  width: "16px",
  height: "16px",
  textAlign: "center",
  lineHeight: "16px",
};
const profileBox = {
  display: "flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "20px",
  background: "#e2e8f0",
  fontSize: "0.9rem",
  border: "none",
  cursor: "pointer",
};
const dropdownBox = {
  position: "absolute",
  top: "35px",
  right: 0,
  width: "230px",
  borderRadius: "10px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
  padding: "10px",
  zIndex: 10,
};
const dropdownTitle = {
  fontSize: "0.9rem",
  fontWeight: "600",
  marginBottom: "8px",
  borderBottom: "1px solid #ddd",
  paddingBottom: "4px",
};
const notifItem = {
  borderBottom: "1px solid #eee",
  paddingBottom: "5px",
  marginBottom: "8px",
  fontSize: "0.85rem",
};
const dropdownItem = {
  fontSize: "0.9rem",
  margin: "8px 0",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  transition: "background 0.2s",
};
const mainContent = {
  flex: 1,
  overflowY: "auto",
  padding: "25px 30px",
};

export default MainLayout;
