import { Link } from 'react-router-dom';

function AdminNavbar() {
  return (
    <nav>
      <Link to="/">Dashboard</Link> | 
      <Link to="/employees">Employees</Link> | 
      <Link to="/work-records">Work Records</Link> | 
      <Link to="/payments">Payments</Link> | 
      <Link to="/invoices">Invoices</Link>
    </nav>
  );
}

export default AdminNavbar;
