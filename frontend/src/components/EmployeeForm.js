import React, { useState, useEffect } from 'react';
import api from '../api';

export default function EmployeeForm({ selected, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'employee',
    password: '',
  });

  useEffect(() => {
    if (selected) {
      setForm({ ...selected, password: '' }); // Don't prefill password
    }
  }, [selected]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await api.put(`/employees/${selected._id}`, form);
      } else {
        await api.post('/employees', form);
      }
      onSave();
    } catch (err) {
      console.error('Save failed:', err.response?.data || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{selected ? 'Edit Employee' : 'Add Employee'}</h3>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
      <select name="role" value={form.role} onChange={handleChange}>
        <option value="employee">Employee</option>
        <option value="admin">Admin</option>
      </select>
      <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" required={!selected} />
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}
