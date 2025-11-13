// ✅ frontend/src/pages/Employees.jsx
import { useEffect, useState } from "react";
import EmployeeForm from "../components/EmployeeForm";
import EmployeeProfileModal from "../components/EmployeeProfileModal";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}"); // ✅ current user

  // ✅ Fetch employees
  useEffect(() => {
    fetch("http://localhost:5000/api/employees", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  // ✅ Add new employee (admin only)
  const handleAdd = (newEmployee) => {
    fetch("http://localhost:5000/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(newEmployee),
    })
      .then((res) => res.json())
      .then((data) => {
        setEmployees((prev) => [...prev, data]);
        setShowForm(false);
      });
  };

  // ✅ Edit employee (admin only)
  const handleEdit = (id) => {
    const employee = employees.find((emp) => emp._id === id);
    setEditData(employee);
    setShowForm(true);
  };

  // ✅ Update employee
  const handleUpdate = (updatedEmployee) => {
    fetch(`http://localhost:5000/api/employees/${editData._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(updatedEmployee),
    })
      .then((res) => res.json())
      .then((data) => {
        setEmployees((prev) =>
          prev.map((emp) => (emp._id === data._id ? data : emp))
        );
        setEditData(null);
        setShowForm(false);
      });
  };

  // ✅ Delete employee (admin only)
  const handleDelete = (id) => {
    fetch(`http://localhost:5000/api/employees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then(() => {
      setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    });
  };

  // ✅ Handle profile update inside modal
  const handleProfileUpdated = (updatedEmp) => {
    setEmployees((prev) =>
      prev.map((e) => (e._id === updatedEmp._id ? updatedEmp : e))
    );
  };

  // ✅ Filter employees if not admin
  const visibleEmployees =
    user.role === "admin"
      ? employees
      : employees.filter((e) => e.email === user.email);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Employee Management</h2>

      {/* Only admin can add employees */}
      {user.role === "admin" && (
        <button
          onClick={() => {
            setShowForm(true);
            setEditData(null);
          }}
          style={{
            background: "#1976d2",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          ➕ Add Employee
        </button>
      )}

      {showForm && (
        <EmployeeForm
          mode={editData ? "edit" : "add"}
          data={editData}
          onSubmit={editData ? handleUpdate : handleAdd}
        />
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{
            width: "100%",
            marginTop: 15,
            borderCollapse: "collapse",
          }}
        >
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              {user.role === "admin" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.map((emp) => (
              <tr key={emp._id}>
                <td>{emp.employeeId}</td>

                {/* 👇 Clickable name to open profile modal */}
                <td
                  style={{
                    color: "#1976d2",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => {
                    // only admin or self can open
                    if (
                      user.role === "admin" ||
                      emp.email === user.email
                    ) {
                      setSelectedEmployee(emp);
                    } else {
                      alert("Access denied: you can only view your own profile.");
                    }
                  }}
                >
                  {emp.name}
                </td>

                <td>{emp.email}</td>
                <td>{emp.role}</td>

                {/* Only admin can edit/delete */}
                {user.role === "admin" && (
                  <td>
                    <button
                      onClick={() => handleEdit(emp._id)}
                      style={{
                        marginRight: "6px",
                        background: "#4CAF50",
                        color: "white",
                        padding: "5px 10px",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(emp._id)}
                      style={{
                        background: "#f44336",
                        color: "white",
                        padding: "5px 10px",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 👇 Modal appears when employee clicked */}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}

export default Employees;
