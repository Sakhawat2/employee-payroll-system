import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EmployeeForm({ onSubmit, initialData = {}, mode = "add" }) {
  const [name, setName] = useState(initialData.name || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [role, setRole] = useState(initialData.role || "employee");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "add" && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const payload = { name, email, role };
    if (mode === "add") payload.password = password;

    onSubmit(payload)
      .then(() => toast.success("Employee saved successfully"))
      .catch(() => toast.error("Failed to save employee"));
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h3>{mode === "edit" ? "Edit Employee" : "Add New Employee"}</h3>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>

        {mode === "add" && (
          <>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </>
        )}

        <button type="submit">{mode === "edit" ? "Update" : "Add"}</button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default EmployeeForm;
