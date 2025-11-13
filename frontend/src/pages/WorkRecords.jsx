import { useState, useEffect, useMemo } from "react";
import Calendar from "react-calendar";
import * as XLSX from "xlsx";
import "react-calendar/dist/Calendar.css";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function WorkRecords() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmployeeAddModal, setShowEmployeeAddModal] = useState(false);
  const [formData, setFormData] = useState({
    start: "",
    end: "",
    employeeId: "",
    status: "pending",
  });
  const [chartType, setChartType] = useState("line");
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  /* =====================================================
     🔹 Load Employees (Admin Only)
  ===================================================== */
  useEffect(() => {
    if (currentUser.role === "admin") {
      fetch("http://localhost:5000/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setEmployees)
        .catch((err) => console.error("Error loading employees:", err));
    }
  }, []);

  /* =====================================================
     🔹 Fetch Work Records
  ===================================================== */
  const fetchRecords = async () => {
    try {
      const query = [];
      if (selectedEmployee) query.push(`employee=${selectedEmployee}`);
      if (selectedMonth) query.push(`month=${selectedMonth}`);
      const url = `http://localhost:5000/api/work-records${
        query.length ? "?" + query.join("&") : ""
      }`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching work records:", err);
    }
  };
  useEffect(() => {
    fetchRecords();
  }, [selectedEmployee, selectedMonth]);

  /* =====================================================
     🔹 Add Record (Admin or Employee)
  ===================================================== */
  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!selectedDate || !formData.start || !formData.end) return;

    const start = new Date(`1970-01-01T${formData.start}:00`);
    const end = new Date(`1970-01-01T${formData.end}:00`);
    const diffHours = (end - start) / (1000 * 60 * 60);

    const newRecord = {
      date: selectedDate.toISOString().split("T")[0],
      hours: diffHours > 0 ? diffHours : 0,
      startTime: formData.start,
      endTime: formData.end,
      employeeId: currentUser.role === "admin" ? formData.employeeId : undefined,
      status: formData.status,
    };

    try {
      const res = await fetch("http://localhost:5000/api/work-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRecord),
      });
      if (!res.ok) throw new Error("Failed to add record");

      setShowAddModal(false);
      setShowEmployeeAddModal(false);
      setFormData({ start: "", end: "", employeeId: "", status: "pending" });
      fetchRecords();
    } catch (err) {
      console.error("Error adding record:", err);
    }
  };

  /* =====================================================
     🔹 Approve / Reject / Delete (Admin)
  ===================================================== */
  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/work-records/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchRecords();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleDelete = async (id, status) => {
    if (status === "approved") return alert("Cannot delete approved records");
    if (!window.confirm("Are you sure to delete this record?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/work-records/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchRecords();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  /* =====================================================
     🔹 Sorting & Filtering
  ===================================================== */
  const filteredByMonth = useMemo(() => {
    let list = records;
    if (selectedMonth) list = list.filter((r) => r.date?.startsWith(selectedMonth));
    if (sortField)
      list = [...list].sort((a, b) => {
        const A = a[sortField] || "";
        const B = b[sortField] || "";
        return sortOrder === "asc" ? A.localeCompare(B) : B.localeCompare(A);
      });
    return list;
  }, [records, selectedMonth, sortField, sortOrder]);

  /* =====================================================
     🔹 Calendar Helpers
  ===================================================== */
  const getTotalHoursByDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const total = records
      .filter((r) => r.date === dateStr)
      .reduce((sum, r) => sum + (r.hours || 0), 0);
    return total ? `${total}h` : "";
  };

  const recordsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return records.filter((r) => r.date === dateStr);
  }, [records, selectedDate]);

  /* =====================================================
     🔹 Chart + Summary
  ===================================================== */
  const monthlyTotals = useMemo(() => {
    const totals = {};
    records.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      totals[key] = (totals[key] || 0) + (r.hours || 0);
    });
    return Object.entries(totals).map(([month, hours]) => ({ month, hours }));
  }, [records]);

  const totalSummary = useMemo(() => {
    const total = filteredByMonth.reduce((sum, r) => sum + (r.hours || 0), 0);
    const approved = filteredByMonth
      .filter((r) => r.status === "approved")
      .reduce((s, r) => s + (r.hours || 0), 0);
    const pending = filteredByMonth
      .filter((r) => r.status === "pending")
      .reduce((s, r) => s + (r.hours || 0), 0);
    const rejected = filteredByMonth
      .filter((r) => r.status === "rejected")
      .reduce((s, r) => s + (r.hours || 0), 0);
    return { total, approved, pending, rejected };
  }, [filteredByMonth]);

  /* =====================================================
     🔹 Export to Excel
  ===================================================== */
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredByMonth);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Work Records");
    XLSX.writeFile(wb, `Work_Records_${selectedMonth || "All"}.xlsx`);
  };

  /* =====================================================
     🔹 RENDER
  ===================================================== */
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr",
        gap: "20px",
        padding: "20px",
        height: "calc(100vh - 80px)",
        overflowY: "auto",
      }}
    >
      {/* LEFT COLUMN — Calendar View */}
      <div style={columnBox}>
        <h2>🗓️ Work Calendar ({currentUser.role})</h2>
        {currentUser.role === "admin" && (
          <>
            <label>
              Employee:{" "}
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">All</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp.employeeId}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <div style={{ marginTop: 10 }}>
          <label>
            Month:{" "}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </label>
        </div>

        <Calendar
          onClickDay={(date) => {
            setSelectedDate(date);
            currentUser.role === "admin"
              ? setShowDateModal(true)
              : setShowEmployeeAddModal(true);
          }}
          value={selectedDate}
          tileContent={({ date }) => (
            <div style={{ fontSize: "0.75rem", color: "#1976d2" }}>
              {getTotalHoursByDate(date)}
            </div>
          )}
        />

        {/* ✅ Admin: View Records for Selected Date */}
        {showDateModal && currentUser.role === "admin" && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              <h3>Work Records for {selectedDate?.toDateString()}</h3>
              {recordsForSelectedDate.length === 0 ? (
                <p>No records found.</p>
              ) : (
                <table border="1" cellPadding="4" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordsForSelectedDate.map((r) => (
                      <tr key={r._id}>
                        <td>{r.employeeName}</td>
                        <td>{r.startTime}</td>
                        <td>{r.endTime}</td>
                        <td>{r.hours}</td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ textAlign: "right", marginTop: 10 }}>
                <button onClick={() => setShowAddModal(true)}>➕ Add Record</button>
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => setShowDateModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Admin: Add Record Popup */}
        {showAddModal && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              <h3>Add Work Record ({selectedDate?.toDateString()})</h3>
              <form onSubmit={handleAddRecord}>
                <label>Employee:</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp.employeeId}>
                      {emp.name}
                    </option>
                  ))}
                </select>

                <label>Start Time:</label>
                <input
                  type="time"
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  required
                />
                <label>End Time:</label>
                <input
                  type="time"
                  value={formData.end}
                  onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                  required
                />

                <label>Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <div style={{ textAlign: "right", marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{ marginRight: 10 }}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={saveBtn}>
                    💾 Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ✅ Employee: Add Own Record Popup */}
        {showEmployeeAddModal && currentUser.role === "employee" && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              <h3>Add Work Hours ({selectedDate?.toDateString()})</h3>
              <form onSubmit={handleAddRecord}>
                <label>Start Time:</label>
                <input
                  type="time"
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  required
                />
                <label>End Time:</label>
                <input
                  type="time"
                  value={formData.end}
                  onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                  required
                />

                <div style={{ textAlign: "right", marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowEmployeeAddModal(false)}
                    style={{ marginRight: 10 }}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={saveBtn}>
                    💾 Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* CENTER COLUMN — Chart & Summary */}
      <div style={columnBox}>
        <h2>📊 Monthly Summary</h2>
        <label>Chart Type: </label>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          style={{ marginBottom: 10 }}
        >
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart</option>
        </select>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === "line" ? (
            <LineChart data={monthlyTotals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#1976d2" />
            </LineChart>
          ) : (
            <BarChart data={monthlyTotals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#4CAF50" />
            </BarChart>
          )}
        </ResponsiveContainer>

        <div style={summaryBox}>
          <h4>Total Hours Summary ({selectedMonth || "All"})</h4>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <span><b>Total:</b> {totalSummary.total}h</span>
            <span style={{ color: "green" }}>✅ {totalSummary.approved}h</span>
            <span style={{ color: "orange" }}>🕓 {totalSummary.pending}h</span>
            <span style={{ color: "red" }}>❌ {totalSummary.rejected}h</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — Schedule Table */}
      <div style={columnBox}>
        <h2>📅 Schedule Table ({selectedMonth || "All"})</h2>
        <button onClick={exportToExcel} style={exportBtn}>
          📥 Export Excel
        </button>
        <table border="1" cellPadding="6" style={{ width: "100%", marginTop: 10 }}>
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Start</th>
              <th>End</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredByMonth.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "gray" }}>
                  No records
                </td>
              </tr>
            ) : (
              filteredByMonth.map((r) => (
                <tr key={r._id}>
                  <td>{r.date}</td>
                  <td>{r.employeeName}</td>
                  <td>{r.startTime}</td>
                  <td>{r.endTime}</td>
                  <td>{r.hours}</td>
                  <td
                    style={{
                      color:
                        r.status === "approved"
                          ? "green"
                          : r.status === "pending"
                          ? "orange"
                          : "red",
                    }}
                  >
                    {r.status}
                  </td>
                  <td>
                    {currentUser.role === "admin" ? (
                      <>
                        <button onClick={() => handleStatusUpdate(r._id, "approved")}>
                          ✅
                        </button>
                        <button onClick={() => handleStatusUpdate(r._id, "rejected")}>
                          ❌
                        </button>
                        <button onClick={() => handleDelete(r._id, r.status)}>🗑</button>
                      </>
                    ) : (
                      r.status !== "approved" && (
                        <button
                          onClick={() => handleDelete(r._id, r.status)}
                          style={{ color: "red" }}
                        >
                          🗑
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --- STYLES --- */
const columnBox = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};
const saveBtn = {
  background: "#1976d2",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
};
const exportBtn = {
  background: "#4CAF50",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
};
const summaryBox = {
  marginTop: 15,
  padding: 10,
  background: "#fafafa",
  borderRadius: 8,
  border: "1px solid #ddd",
  textAlign: "center",
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
  zIndex: 1000,
};
const modalBox = {
  background: "#fff",
  padding: 25,
  borderRadius: 10,
  width: 400,
  boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
  maxHeight: "80vh",
  overflowY: "auto",
};

export default WorkRecords;
