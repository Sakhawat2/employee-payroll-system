import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function Settings() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [personal, setPersonal] = useState({});
  const [bank, setBank] = useState({});
  const [employment, setEmployment] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({});
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "admin";

  // Load employees
  useEffect(() => {
    if (!token) return;
    setUser(currentUser);

    const load = async () => {
      try {
        if (isAdmin) {
          const res = await fetch("http://localhost:5000/api/employees", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setEmployees(data);

          const self = data.find((e) => e._id === currentUser._id);
          setSelectedEmployee(self || data[0] || null);
        } else {
          setSelectedEmployee(currentUser);
        }
      } catch (err) {
        console.error("Error loading employees:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fetch employee + holidays
  const fetchEmployeeData = async (emp) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/employees/${emp._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      setPersonal({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        citizenship: data.citizenship,
      });

      setBank(data.bankInfo || {});

      setEmployment({
        employeeId: data.employeeId,
        role: data.role,
        email: data.email,
        hourlyRate: data.hourlyRate || "",
        joinDate: data.joinDate || "",
        jobTitle: data.jobTitle || "",
        contractType: data.contractType || "",
        workingHours: data.workingHours || "",
      });

      const query = isAdmin ? `?employeeId=${emp._id}` : "";
      const holRes = await fetch(
        `http://localhost:5000/api/holidays${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const holData = await holRes.json();
      setHolidays(holData);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    if (selectedEmployee?._id) fetchEmployeeData(selectedEmployee);
  }, [selectedEmployee]);

  // Save Personal/Bank/Employment Section
  const handleSaveSection = async (section) => {
    const empId = selectedEmployee._id;

    let body = {};

    if (section === "personal") body = personal;
    if (section === "bank") body = { bankInfo: bank };
    if (section === "employment") body = employment;

    const url =
      isAdmin && section !== "password"
        ? `http://localhost:5000/api/employees/${empId}`
        : `http://localhost:5000/api/employees/${empId}/self-update`;

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Update failed");

      alert("Saved successfully");
      await fetchEmployeeData(selectedEmployee);
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    }
  };

  // Holiday modal
  const openHolidayModal = (holiday = null) => {
    setEditingHoliday(holiday);
    setHolidayForm(
      holiday || {
        type: "",
        startDate: new Date(),
        endDate: new Date(),
        notes: "",
        approval: "Pending",
      }
    );
    setShowHolidayModal(true);
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const payload = {
      ...holidayForm,
      employeeId: selectedEmployee._id,
      employeeName: selectedEmployee.name,
      startDate:
        typeof holidayForm.startDate === "string"
          ? holidayForm.startDate
          : holidayForm.startDate.toISOString().split("T")[0],
      endDate:
        typeof holidayForm.endDate === "string"
          ? holidayForm.endDate
          : holidayForm.endDate.toISOString().split("T")[0],
    };

    const url = editingHoliday
      ? `http://localhost:5000/api/holidays/${editingHoliday._id}`
      : `http://localhost:5000/api/holidays`;

    const method = editingHoliday ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    setShowHolidayModal(false);
    setEditingHoliday(null);
    fetchEmployeeData(selectedEmployee);
  };

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>;

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px",
        height: "calc(100vh - 100px)",
        overflowY: "auto",
      }}
    >
      {/* LEFT */}
      <div style={{ flex: 1 }}>
        {isAdmin && employees.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <strong>Select Employee:</strong>
            <select
              value={selectedEmployee?._id || ""}
              onChange={(e) =>
                setSelectedEmployee(
                  employees.find((emp) => emp._id === e.target.value)
                )
              }
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Personal */}
        <section style={sectionBox}>
          <h3>👤 Personal Information</h3>
          {["name", "email", "phone", "address", "citizenship"].map((f) => (
            <div key={f}>
              <label style={labelStyle}>{f.toUpperCase()}</label>
              <input
                style={inputStyle}
                value={personal[f] || ""}
                onChange={(e) =>
                  setPersonal({ ...personal, [f]: e.target.value })
                }
              />
            </div>
          ))}
          <button
            style={saveBtn}
            onClick={() => handleSaveSection("personal")}
          >
            Save
          </button>
        </section>

        {/* Bank */}
        <section style={sectionBox}>
          <h3>🏦 Bank Information</h3>
          {["bankName", "accountNumber", "iban", "paymentMethod"].map((f) => (
            <div key={f}>
              <label style={labelStyle}>{f.toUpperCase()}</label>
              <input
                style={inputStyle}
                value={bank[f] || ""}
                onChange={(e) =>
                  setBank({ ...bank, [f]: e.target.value })
                }
              />
            </div>
          ))}
          <button
            style={saveBtn}
            onClick={() => handleSaveSection("bank")}
          >
            Save
          </button>
        </section>

        {/* Password */}
        <section style={sectionBox}>
          <h3>🔒 Change Password</h3>
          <input type="password" placeholder="Old Password" style={inputStyle} />
          <input type="password" placeholder="New Password" style={inputStyle} />
          <input type="password" placeholder="Confirm Password" style={inputStyle} />
          <button style={saveBtn}>Update Password</button>
        </section>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1 }}>
        {/* Employment (Admin Only Editable) */}
        <section style={sectionBox}>
          <h3>💼 Employment Information</h3>
          {Object.entries(employment).map(([key, value]) => (
            <div key={key}>
              <label style={labelStyle}>{key.toUpperCase()}</label>
              <input
                style={inputStyle}
                value={value || ""}
                onChange={(e) =>
                  isAdmin &&
                  setEmployment({ ...employment, [key]: e.target.value })
                }
                disabled={!isAdmin}
              />
            </div>
          ))}
          {isAdmin && (
            <button
              style={saveBtn}
              onClick={() => handleSaveSection("employment")}
            >
              Save Employment Info
            </button>
          )}
        </section>

        {/* Holidays */}
        <section style={sectionBox}>
          <h3>🏖️ Holiday Requests</h3>
          <button style={addBtn} onClick={() => openHolidayModal()}>
            Add Holiday
          </button>

          <table
            border="1"
            cellPadding="6"
            style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse" }}
          >
            <thead style={{ background: "#f0f0f0" }}>
              <tr>
                <th>Status</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Notes</th>
                <th>Approval</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No holiday requests found.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h._id}>
                    <td>{h.status}</td>
                    <td>{h.type}</td>
                    <td>{h.startDate}</td>
                    <td>{h.endDate}</td>
                    <td>{h.notes}</td>
                    <td>{h.approval}</td>
                    <td>
                      {(isAdmin || currentUser._id === h.employeeId) && (
                        <button onClick={() => openHolidayModal(h)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* Modal */}
      {showHolidayModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>{editingHoliday ? "Edit Holiday" : "Add Holiday"}</h3>
            <form onSubmit={handleHolidaySubmit}>
              <label style={labelStyle}>Type</label>
              <select
                style={inputStyle}
                value={holidayForm.type}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, type: e.target.value })
                }
              >
                <option value="">Select</option>
                <option value="Annual">Annual</option>
                <option value="Sick">Sick</option>
                <option value="Other">Other</option>
              </select>

              <label style={labelStyle}>Start</label>
              <DatePicker
                selected={new Date(holidayForm.startDate)}
                onChange={(d) =>
                  setHolidayForm({
                    ...holidayForm,
                    startDate: d.toISOString().split("T")[0],
                  })
                }
              />

              <label style={labelStyle}>End</label>
              <DatePicker
                selected={new Date(holidayForm.endDate)}
                onChange={(d) =>
                  setHolidayForm({
                    ...holidayForm,
                    endDate: d.toISOString().split("T")[0],
                  })
                }
              />

              <label style={labelStyle}>Notes</label>
              <textarea
                style={inputStyle}
                value={holidayForm.notes}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, notes: e.target.value })
                }
              />

              {isAdmin && (
                <>
                  <label style={labelStyle}>Approval</label>
                  <select
                    style={inputStyle}
                    value={holidayForm.approval}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, approval: e.target.value })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </>
              )}

              <div style={{ marginTop: 20, textAlign: "right" }}>
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={saveBtn}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* Styles */
const sectionBox = {
  marginBottom: "25px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "15px",
  background: "#fafafa",
};
const labelStyle = { display: "block", marginTop: 8, fontWeight: "bold" };
const inputStyle = {
  width: "100%",
  padding: "8px",
  marginTop: "4px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};
const saveBtn = {
  marginTop: "10px",
  background: "#1976d2",
  color: "white",
  padding: "8px 12px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
const addBtn = {
  background: "#4CAF50",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};
const modalBox = {
  background: "#fff",
  padding: "25px",
  borderRadius: "10px",
  width: "400px",
};

export default Settings;
