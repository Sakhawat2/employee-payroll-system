import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔹 Load employees
  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Failed to fetch employees:", err));
  }, []);

  // 🔹 Load payments
  useEffect(() => {
    let url = "http://localhost:5000/api/payments";
    if (selectedMonth) url += `?month=${selectedMonth}`;

    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setPayments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch payments:", err);
        setLoading(false);
      });
  }, [selectedMonth]);

  // 🔍 Filter by employee
  const filteredPayments = useMemo(() => {
    if (!selectedEmployee) return payments;
    return payments.filter((p) => p.employeeId === selectedEmployee);
  }, [payments, selectedEmployee]);

  // 💰 Calculate total paid
  const totalPaid = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (p.totalPay || 0), 0);
  }, [filteredPayments]);

  // 📊 Export to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredPayments);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PaymentHistory");
    XLSX.writeFile(wb, `Payment_History_${selectedMonth || "All"}.xlsx`);
  };

  // 📄 Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Payment History (${selectedMonth || "All"})`, 14, 12);
    autoTable(doc, {
      startY: 20,
      head: [["Employee", "Month", "Hours", "Rate", "Total Pay", "Date Paid"]],
      body: filteredPayments.map((p) => [
        `${p.employeeName} (${p.employeeId})`,
        p.month,
        p.totalHours,
        `$${p.ratePerHour}`,
        `$${p.totalPay.toFixed(2)}`,
        new Date(p.datePaid).toLocaleDateString(),
      ]),
    });
    doc.save(`Payment_History_${selectedMonth || "All"}.pdf`);
  };

  // 📈 Prepare Monthly Payroll Trend Data
  const monthlyTotals = useMemo(() => {
    const totals = {};
    payments.forEach((p) => {
      if (!p.month) return;
      totals[p.month] = (totals[p.month] || 0) + (p.totalPay || 0);
    });
    return Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
  }, [payments]);

  return (
    <div style={{ padding: 20 }}>
      <h2>🧾 Payment History</h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <label>
          Employee:
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

        <label>
          Month:
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </label>

        <button
          onClick={exportToExcel}
          style={{ background: "#4CAF50", color: "white" }}
        >
          📊 Export Excel
        </button>
        <button
          onClick={exportToPDF}
          style={{ background: "#2196F3", color: "white" }}
        >
          📄 Export PDF
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading payments...</p>
      ) : (
        <table
          border="1"
          cellPadding="6"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th>Employee</th>
              <th>Month</th>
              <th>Total Hours</th>
              <th>Rate ($/hr)</th>
              <th>Total Pay ($)</th>
              <th>Date Paid</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "gray" }}>
                  No payment records found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p._id}>
                  <td>{p.employeeName} ({p.employeeId})</td>
                  <td>{p.month}</td>
                  <td>{p.totalHours}</td>
                  <td>{p.ratePerHour}</td>
                  <td>{p.totalPay.toFixed(2)}</td>
                  <td>{new Date(p.datePaid).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
          {filteredPayments.length > 0 && (
            <tfoot style={{ background: "#f9f9f9", fontWeight: "bold" }}>
              <tr>
                <td colSpan="4" style={{ textAlign: "right" }}>
                  Total Paid:
                </td>
                <td colSpan="2">${totalPaid.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}

      {/* 📈 Monthly Payroll Trend Chart */}
      {monthlyTotals.length > 0 && (
        <div style={{ marginTop: 50 }}>
          <h3>📈 Monthly Payroll Cost Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={monthlyTotals}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => `$${value.toFixed(2)}`}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="total" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;
