import { useState } from "react";
import { Camera } from "lucide-react"; // for a camera icon

function EmployeeProfileModal({ employee, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    ...employee,
    bankInfo: employee.bankInfo || {},
  });
  const [previewImage, setPreviewImage] = useState(employee.photo || null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      bankInfo: { ...prev.bankInfo, [name]: value },
    }));
  };

  const handleSave = async () => {
    const res = await fetch(`http://localhost:5000/api/employees/${employee._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const updated = await res.json();
    onUpdated(updated);
    onClose();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      setFormData((prev) => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={overlay}
      onClick={onClose}
    >
      <div style={modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* --- HEADER CARD --- */}
        <div style={headerCard}>
          <div style={{ position: "relative" }}>
            <img
              src={previewImage || "https://via.placeholder.com/100"}
              alt="Employee"
              style={photoStyle}
            />
            <label htmlFor="uploadPhoto" style={cameraButton}>
              <Camera size={18} />
            </label>
            <input
              id="uploadPhoto"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 5px", fontSize: "1.4rem" }}>
              {employee.name}
            </h2>
            <p style={{ margin: 0, color: "#666" }}>
              {employee.role === "admin" ? "Administrator" : "Employee"}
            </p>
            <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>
              📧 {employee.email}
            </p>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>📞 {employee.phone || "-"}</p>
          </div>
        </div>

        {/* --- TABS --- */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={() => setActiveTab("personal")}
            style={{
              ...tabButton,
              background: activeTab === "personal" ? "#1976d2" : "#f5f5f5",
              color: activeTab === "personal" ? "white" : "black",
            }}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            style={{
              ...tabButton,
              background: activeTab === "bank" ? "#1976d2" : "#f5f5f5",
              color: activeTab === "bank" ? "white" : "black",
            }}
          >
            Bank Info
          </button>
        </div>

        {/* --- PERSONAL INFO TAB --- */}
        {activeTab === "personal" && (
          <div>
            <h4>Personal Information</h4>
            <label>Full Name:</label>
            <input name="name" value={formData.name} onChange={handleChange} style={inputStyle} />

            <label>Email:</label>
            <input name="email" value={formData.email} onChange={handleChange} style={inputStyle} />

            <label>Phone:</label>
            <input
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              style={inputStyle}
            />

            <label>Address:</label>
            <input
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              style={inputStyle}
            />

            <label>Personal ID No:</label>
            <input
              name="personalId"
              value={formData.personalId || ""}
              onChange={handleChange}
              style={inputStyle}
            />

            <label>Date of Birth:</label>
            <input
              type="date"
              name="dob"
              value={formData.dob || ""}
              onChange={handleChange}
              style={inputStyle}
            />

            <label>Gender:</label>
            <select
              name="gender"
              value={formData.gender || ""}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <label>Citizenship:</label>
            <input
              name="citizenship"
              value={formData.citizenship || ""}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        )}

        {/* --- BANK INFO TAB --- */}
        {activeTab === "bank" && (
          <div>
            <h4>Bank Account Information</h4>

            <label>Bank Name:</label>
            <input
              name="bankName"
              value={formData.bankInfo.bankName || ""}
              onChange={handleBankChange}
              style={inputStyle}
            />

            <label>Account Number:</label>
            <input
              name="accountNumber"
              value={formData.bankInfo.accountNumber || ""}
              onChange={handleBankChange}
              style={inputStyle}
            />

            <label>IBAN / SWIFT:</label>
            <input
              name="iban"
              value={formData.bankInfo.iban || ""}
              onChange={handleBankChange}
              style={inputStyle}
            />

            <label>Payment Method:</label>
            <select
              name="paymentMethod"
              value={formData.bankInfo.paymentMethod || ""}
              onChange={handleBankChange}
              style={inputStyle}
            >
              <option value="">Select</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}

        {/* --- FOOTER BUTTONS --- */}
        <div style={{ textAlign: "right", marginTop: "15px" }}>
          <button
            onClick={onClose}
            style={{
              marginRight: "10px",
              padding: "8px 12px",
              background: "#ccc",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: "#4CAF50",
              color: "white",
              padding: "8px 12px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- STYLES --- */
const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContainer = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  width: "600px",
  boxShadow: "0 0 15px rgba(0,0,0,0.2)",
  maxHeight: "90vh",
  overflowY: "auto",
};

const headerCard = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  paddingBottom: "15px",
  borderBottom: "1px solid #ddd",
  marginBottom: "15px",
};

const photoStyle = {
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid #1976d2",
};

const cameraButton = {
  position: "absolute",
  bottom: "0",
  right: "0",
  background: "#1976d2",
  color: "white",
  borderRadius: "50%",
  padding: "4px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const tabButton = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontWeight: "bold",
  cursor: "pointer",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "8px",
  marginBottom: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
};

export default EmployeeProfileModal;
