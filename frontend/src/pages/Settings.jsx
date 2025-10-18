import React from "react";

function Settings() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>⚙️ Settings / Profile</h2>
      <p>Here you can manage your account information, password, and preferences.</p>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          maxWidth: "400px",
        }}
      >
        <h3>👤 Admin Profile</h3>
        <p><b>Name:</b> Admin User</p>
        <p><b>Email:</b> admin@example.com</p>
        <button
          style={{
            background: "#2196F3",
            color: "white",
            padding: "8px 12px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}

export default Settings;
