import { useEffect, useState } from 'react';
import EmployeeForm from '../components/EmployeeForm';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  

  useEffect(() => {
    fetch('http://localhost:5000/api/employees')
      .then(res => res.json())
      .then(data => {
        setEmployees(data);
        setLoading(false);
      });
  }, []);

  const handleAdd = (newEmployee) => {
    fetch('http://localhost:5000/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmployee)
    })
      .then(res => res.json())
      .then(data => {
        setEmployees(prev => [...prev, data]);
        setShowForm(false);
      });
  };

  const handleEdit = (id) => {
    const employee = employees.find(emp => emp._id === id);
    setEditData(employee);
    setShowForm(true);
  };

  const handleUpdate = (updatedEmployee) => {
    fetch(`http://localhost:5000/api/employees/${editData._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEmployee)
    })
      .then(res => res.json())
      .then(data => {
        setEmployees(prev =>
          prev.map(emp => (emp._id === data._id ? data : emp))
        );
        setEditData(null);
        setShowForm(false);
      });
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:5000/api/employees/${id}`, {
      method: 'DELETE'
    }).then(() => {
      setEmployees(prev => prev.filter(emp => emp._id !== id));
    });
  };

  const handleReset = (id) => {
    fetch(`http://localhost:5000/api/employees/${id}/reset-password`, {
      method: 'PUT'
    }).then(() => {
      alert('Password reset successfully');
    });
  };

  return (
    <div>
      <h2>Employee Management</h2>
      <button onClick={() => { setShowForm(true); setEditData(null); }}>
        Add Employee
      </button>

      {showForm && (
        <EmployeeForm
          onSubmit={handleAdd}
          mode="add"
        />
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%", marginTop: "15px" }}>
            <thead style={{ background: "#f5f5f5" }}>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
             <tbody>
               {employees.map((emp) => (
                <tr key={emp._id}>
                     <td>{emp.employeeId}</td>
                     <td>{emp.name}</td>
                     <td>{emp.email}</td>
                     <td>{emp.role}</td>
                     <td>
                      <button onClick={() => handleEdit(emp._id)}>✏️ Edit</button>{" "}
                      <button onClick={() => handleDelete(emp._id)}>🗑 Delete</button>{" "}
                      <button onClick={() => handleReset(emp._id)}>🔑 Reset Password</button>
                    </td>
               </tr>
           ))}
          </tbody>
         </table>

        </table>
      )}
    </div>
  );
}

export default Employees;
