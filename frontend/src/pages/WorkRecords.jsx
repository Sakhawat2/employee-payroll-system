import { useState, useEffect, useMemo } from "react";
import WorkRecordForm from "../components/WorkRecordForm";

function WorkRecords() {
  const [records, setRecords] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employees, setEmployees] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load employees
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("http://localhost:5000/api/employees");
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading employees:", err);
      }
    }
    loadEmployees();
  }, []);

  // Load records (optionally filtered by employee)
  const fetchRecords = async (employeeId = "") => {
    try {
      const url = employeeId
        ? `http://localhost:5000/api/work-records?employee=${employeeId}`
        : "http://localhost:5000/api/work-records";
      const res = await fetch(url);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading records:", err);
      setRecords([]);
    }
  };

  useEffect(() => {
    fetchRecords(selectedEmployee);
  }, [selectedEmployee]);

  // Compute monthly totals
  const monthlyTotals = useMemo(() => {
    const totals = {};
    records.forEach((rec) => {
      if (!rec.date || !rec.hours) return;
      const date = new Date(rec.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      totals[monthKey] = (totals[monthKey] || 0) + rec.hours;
    });
    return totals;
  }, [records]);

  const handleAdd = async (record) => {
    try {
      const res = await fetch("http://localhost:5000/api/work-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error("Failed to add record");
      setShowModal(false);
      fetchRecords(selectedEmployee);
    } catch (err) {
      console.error("Error adding record:", err);
      alert("Error adding record");
    }
  };

  const handleUpdate = async (record) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/work-records/${editingRecord._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        }
      );
      if (!res.ok) throw new Error("Failed to update record");
      setEditingRecord(null);
      setShowModal(false);
      fetchRecords(selectedEmployee);
    } catch (err) {
      console.error("Error updating record:", err);
      alert("Error updating record");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/work-records/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete record");
      fetchRecords(selectedEmployee);
    } catch (err) {
      console.error("Error deleting record:", err);
      alert("Error deleting record");
    }
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Work Records</h2>

      <div style={{ marginBottom: 12 }}>
        <label>
          Filter by Employee:{" "}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">All</option>
            {employees.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.name} ({emp.employeeId})
              </option>
            ))}
          </select>
        </label>

        <button onClick={handleAddClick} style={{ marginLeft: 12 }}>
          ➕ Add Work Record
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* 🔹 Left Table — Daily Work Records */}
        <div style={{ flex: 2 }}>
          <table
            border="1"
            cellPadding="6"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead style={{ background: "#eee" }}>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "gray" }}>
                    No work records found.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec._id}>
                    <td>{rec.employeeName || rec.employeeId}</td>
                    <td>{rec.date}</td>
                    <td>{rec.hours}</td>
                    <td
                      style={{
                        color:
                          rec.status === "rejected"
                            ? "red"
                            : rec.status === "approved"
                            ? "green"
                            : "black",
                        fontWeight: "bold",
                      }}
                    >
                      {rec.status}
                    </td>
                    <td>
                      <button onClick={() => handleEditClick(rec)}>✏️ Edit</button>{" "}
                      <button onClick={() => handleDelete(rec._id)}>🗑 Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 🔹 Right Table — Monthly Total Hours */}
        <div style={{ flex: 1 }}>
          <h3>Monthly Total Hours</h3>
          <table
            border="1"
            cellPadding="6"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead style={{ background: "#eee" }}>
              <tr>
                <th>Month</th>
                <th>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyTotals).length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center", color: "gray" }}>
                    No data
                  </td>
                </tr>
              ) : (
                Object.entries(monthlyTotals).map(([month, total]) => (
                  <tr key={month}>
                    <td>{month}</td>
                    <td style={{ fontWeight: "bold" }}>{total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔹 Popup Modal for Add/Edit */}
      {showModal && (
        <div
          style={{
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
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 20,
              borderRadius: 8,
              width: "400px",
              boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            }}
          >
            <WorkRecordForm
              mode={editingRecord ? "edit" : "add"}
              initialData={editingRecord || {}}
              onSubmit={editingRecord ? handleUpdate : handleAdd}
            />
            <button
              onClick={() => setShowModal(false)}
              style={{ marginTop: 8, background: "#ccc" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkRecords;
