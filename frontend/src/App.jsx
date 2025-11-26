import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import WorkRecords from "./pages/WorkRecords";
import Payroll from "./pages/Payroll";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./utils/ProtectedRoute";
import MyPayroll from "./pages/MyPayroll";

function App() {
  return (
    <Router>
  <Routes>

    {/* Public */}
    <Route path="/login" element={<Login />} />

    {/* Protected + Layout */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="employees" element={<Employees />} />
      <Route path="work-records" element={<WorkRecords />} />
      <Route path="payroll" element={<Payroll />} />
      <Route path="invoices" element={<Invoices />} />
      <Route path="settings" element={<Settings />} />

      {/* EMPLOYEE PAYSLIP ROUTE MUST BE INSIDE MAINLAYOUT */}
      <Route path="my-payroll" element={<MyPayroll />} />
    </Route>

  </Routes>
</Router>

  );
}

export default App;
