import React, { useEffect, useState } from 'react';
import api from '../api';
import EmployeeTable from '../components/EmployeeTable';
import EmployeeForm from '../components/EmployeeForm';

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (emp) => {
    setSelected(emp);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        console.error('Delete failed:', err.response?.data || err.message);
      }
    }
  };

  const handleAdd = () => {
    setSelected(null);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    fetchEmployees();
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      {!showForm && (
        <>
          <button className="btn btn-success mb-3" onClick={handleAdd}>
            Add Employee
          </button>
          <EmployeeTable
            employees={employees}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}
      {showForm && (
        <EmployeeForm
          selected={selected}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
