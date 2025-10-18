import { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Lock } from "lucide-react";

function Profile() {
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@company.com",
    phone: "+358 123 456 789",
    role: "Administrator",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [saved, setSaved] = useState(false);

  // Auto-hide success message
  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Future: send updated profile to backend
    console.log("Updated Profile:", profile);
    setSaved(true);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match!");
      return;
    }
    console.log("Password updated:", passwords);
    alert("Password updated successfully!");
    setPasswords({ current: "", new: "", confirm: "" });
  };

  return (
    <div style={container}>
      <h2 style={title}>👤 User Profile</h2>

      {/* Profile Card */}
      <div style={card}>
        <div style={avatarBox}>
          <img
            src="https://via.placeholder.com/100"
            alt="Profile"
            style={avatar}
          />
          <h3>{profile.name}</h3>
          <p style={{ color: "gray" }}>{profile.role}</p>
        </div>

        <form onSubmit={handleSave} style={form}>
          <div style={fieldRow}>
            <User size={18} />
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              placeholder="Full Name"
              style={input}
            />
          </div>
          <div style={fieldRow}>
            <Mail size={18} />
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              placeholder="Email"
              style={input}
            />
          </div>
          <div style={fieldRow}>
            <Phone size={18} />
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              placeholder="Phone"
              style={input}
            />
          </div>
          <div style={fieldRow}>
            <Shield size={18} />
            <input
              type="text"
              name="role"
              value={profile.role}
              onChange={handleChange}
              placeholder="Role"
              style={input}
              disabled
            />
          </div>

          <button type="submit" style={saveBtn}>
            💾 Save Changes
          </button>
          {saved && <p style={{ color: "green" }}>Profile updated!</p>}
        </form>
      </div>

      {/* Password Section */}
      <div style={{ ...card, marginTop: 30 }}>
        <h3 style={{ marginBottom: 10 }}>
          <Lock size={18} style={{ marginRight: 6 }} />
          Change Password
        </h3>
        <form onSubmit={handlePasswordUpdate} style={form}>
          <input
            type="password"
            name="current"
            value={passwords.current}
            onChange={handlePasswordChange}
            placeholder="Current Password"
            style={input}
          />
          <input
            type="password"
            name="new"
            value={passwords.new}
            onChange={handlePasswordChange}
            placeholder="New Password"
            style={input}
          />
          <input
            type="password"
            name="confirm"
            value={passwords.confirm}
            onChange={handlePasswordChange}
            placeholder="Confirm New Password"
            style={input}
          />
          <button type="submit" style={saveBtn}>
            🔐 Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

/* --- Styles --- */
const container = {
  padding: "30px",
  maxWidth: "800px",
  margin: "0 auto",
};

const title = {
  marginBottom: "20px",
  fontWeight: "600",
  color: "#1e293b",
};

const card = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
};

const avatarBox = {
  textAlign: "center",
  marginBottom: "20px",
};

const avatar = {
  borderRadius: "50%",
  width: "100px",
  height: "100px",
  marginBottom: "10px",
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const fieldRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "#f9fafb",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
};

const input = {
  flex: 1,
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: "0.95rem",
};

const saveBtn = {
  background: "#2563eb",
  color: "white",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "500",
  marginTop: "10px",
};

export default Profile;
