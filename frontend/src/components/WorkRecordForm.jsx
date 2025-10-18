import { useState, useEffect } from "react";

function WorkRecordForm({ onSubmit, initialData = {}, mode = "add" }) {
  const [employeeId, setEmployeeId] = useState(initialData.employeeId || "");
  const [employeeName, setEmployeeName] = useState(initialData.employeeName || "");
  const [date, setDate] = useState(initialData.date || "");
  const [hours, setHours] = useState(initialData.hours ?? "");
  const [status, setStatus] = useState(initialData.status || "pending");
  const [employeeList, setEmployeeList] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    async function loadEmployees() {
      try {
        setLoadingEmployees(true);
        const res = await fetch("http://localhost:5000/api/employees");
        if (!res.ok) throw new Error("Failed to fetch employees");
        const data = await res.json();
        setEmployeeList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("loadEmployees error:", err);
        setEmployeeList([]);
      } finally {
        setLoadingEmployees(false);
      }
    }
    loadEmployees();
  }, []);

  useEffect(() => {
    const selected = employeeList.find((emp) => emp.employeeId === employeeId);
    setEmployeeName(selected ? selected.name : "");
  }, [employeeId, employeeList]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employeeId || !date || hours === "") {
      alert("Please fill all fields correctly.");
      return;
    }
    onSubmit({ employeeId, employeeName, date, hours: Number(hours), status });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{mode === "edit" ? "Edit Work Record" : "Add Work Record"}</h3>

      <label>
        Employee:
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
        >
          <option value="">Select Employee</option>
          {loadingEmployees && <option>Loading...</option>}
          {employeeList.map((emp) => (
            <option key={emp.employeeId} value={emp.employeeId}>
              {emp.name} ({emp.employeeId})
            </option>
          ))}
        </select>
      </label>

      <br />
      <label>
        Date:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>

      <br />
      <label>
        Hours:
        <input
          type="number"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          required
          min="0"
          step="0.25"
        />
      </label>

      <br />
      <label>
        Status:
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>

      <br />
      <button type="submit" style={{ marginTop: 10 }}>
        {mode === "edit" ? "Update" : "Add"}
      </button>
    </form>
  );
}

export default WorkRecordForm;
