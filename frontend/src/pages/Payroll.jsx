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
import { generatePayslip } from "../utils/generatePayslip";

// Helper for attaching auth token
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function Payroll() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(false);

  // User-adjustable financial settings
  const [rate, setRate] = useState(15);
  const [tax, setTax] = useState(14.5);
  const [pension, setPension] = useState(7.15);
  const [unemployment, setUnemployment] = useState(0.59);

  // Fetch Employees
  useEffect(() => {
    fetch("http://localhost:5000/api/employees", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  // Fetch Work Records
  useEffect(() => {
    fetch("http://localhost:5000/api/work-records", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

  // Filter records by employee + month
  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (selectedEmployee)
      result = result.filter((r) => r.employeeId === selectedEmployee);
    if (selectedMonth)
      result = result.filter((r) => r.date?.startsWith(selectedMonth));
    return result;
  }, [records, selectedEmployee, selectedMonth]);

  // Calculate payroll per employee
  const payrollSummary = useMemo(() => {
    const totals = {};
    filteredRecords.forEach((r) => {
      const emp = employees.find((e) => e.employeeId === r.employeeId);
      const empRate = emp?.hourlyRate || rate;

      if (!totals[r.employeeId]) {
        totals[r.employeeId] = {
          employeeId: r.employeeId,
          employeeName: emp?.name || r.employeeName || "Unknown",
          rate: empRate,
          totalHours: 0,
          totalPay: 0,
          status: "unpaid",
          datePaid: null,
        };
      }

      totals[r.employeeId].totalHours += Number(r.hours) || 0;
      totals[r.employeeId].totalPay =
        totals[r.employeeId].totalHours * empRate;
    });
    return Object.values(totals);
  }, [filteredRecords, employees, rate]);

  useEffect(() => {
    setPayroll(payrollSummary);
  }, [payrollSummary]);

  // Export to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(payroll);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    XLSX.writeFile(wb, `Payroll_${selectedMonth || "All"}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Payroll Summary (${selectedMonth || "All"})`, 14, 12);
    autoTable(doc, {
      startY: 20,
      head: [["Employee", "Hours", "Rate (€)", "Pay (€)", "Status"]],
      body: payroll.map((p) => [
        `${p.employeeName} (${p.employeeId})`,
        p.totalHours,
        p.rate,
        p.totalPay.toFixed(2),
        p.status.toUpperCase(),
      ]),
    });
    doc.save(`Payroll_${selectedMonth || "All"}.pdf`);
  };

  // Generate Payslip
  const handleGeneratePayslip = (p) => {
    const company = {
      name: "Centria Payroll Systems Oy",
      address: "Niemenkatu 10 B",
      city: "68600 Pietarsaari, Finland",
      businessId: "FI-1234567-8",
      logo: "/logo.png",
    };

    const payrollData = {
      period: selectedMonth || "N/A",
      payday: new Date().toLocaleDateString(),
      rate: p.rate,
      totalHours: p.totalHours,
      totalPay: p.totalPay,
      deductions: { tax, pension, unemployment },
    };

    generatePayslip(p, company, payrollData);
  };

  // Mark Paid / Unpaid
  const toggleStatus = async (empId) => {
    setPayroll((prev) =>
      prev.map((p) =>
        p.employeeId === empId
          ? {
              ...p,
              status: p.status === "paid" ? "unpaid" : "paid",
              datePaid: p.status === "paid" ? null : new Date().toISOString(),
            }
          : p
      )
    );

    const emp = payroll.find((p) => p.employeeId === empId);
    if (!emp) return;

    if (emp.status === "unpaid") {
      await fetch("http://localhost:5000/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          month: selectedMonth || "N/A",
          totalHours: emp.totalHours,
          totalPay: emp.totalPay,
          ratePerHour: emp.rate,
        }),
      });
    }
  };

  const totalPayroll = useMemo(
    () => payroll.reduce((sum, p) => sum + p.totalPay, 0),
    [payroll]
  );

  // NET PAY preview
  const previewData = useMemo(() => {
    if (payroll.length === 0) return { gross: 0, totalDeductions: 0, net: 0 };

    const gross = payroll.reduce((sum, p) => sum + p.totalPay, 0);
    const taxAmount = (gross * tax) / 100;
    const pensionAmount = (gross * pension) / 100;
    const unemploymentAmount = (gross * unemployment) / 100;
    const totalDeductions = taxAmount + pensionAmount + unemploymentAmount;
    const net = gross - totalDeductions;

    return {
      gross,
      taxAmount,
      pensionAmount,
      unemploymentAmount,
      totalDeductions,
      net,
    };
  }, [payroll, tax, pension, unemployment]);

  // 🏦 Download SEPA XML
  const downloadSepaXml = async () => {
    if (!selectedMonth) {
      alert("Please select a month first.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/payroll/sepa-file?month=${selectedMonth}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to generate SEPA XML");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SEPA_${selectedMonth}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading SEPA XML:", err);
      alert("Error generating SEPA XML");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>💰 Payroll Management</h2>

      {/* ------------- 3-COLUMN LAYOUT (Matches Your UI) ------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "30% 40% 30%",
          gap: "25px",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          {/* --- Filters --- */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
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

            <label>
              Hourly Rate (€):
              <input
                type="number"
                value={rate}
                onChange={(e) =>
                  setRate(parseFloat(e.target.value) || 0)
                }
                step="0.1"
              />
            </label>

            <label>
              Tax (%):
              <input
                type="number"
                value={tax}
                onChange={(e) =>
                  setTax(parseFloat(e.target.value) || 0)
                }
                step="0.1"
              />
            </label>

            <label>
              Pension (%):
              <input
                type="number"
                value={pension}
                onChange={(e) =>
                  setPension(parseFloat(e.target.value) || 0)
                }
                step="0.1"
              />
            </label>

            <label>
              Unemployment (%):
              <input
                type="number"
                value={unemployment}
                onChange={(e) =>
                  setUnemployment(parseFloat(e.target.value) || 0)
                }
                step="0.1"
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

            <button
              onClick={downloadSepaXml}
              style={{ background: "#6a1b9a", color: "white" }}
            >
              🏦 Export SEPA XML
            </button>
          </div>

          {/* --- Net Pay Summary --- */}
          {payroll.length > 0 && (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "16px",
                background: "#f9fafb",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <h3>💶 Net Pay Summary (Preview)</h3>
              <p>
                <strong>Gross Pay:</strong> €
                {previewData.gross.toFixed(2)}
              </p>

              <p>
                <strong>Deductions:</strong>
              </p>
              <ul style={{ marginLeft: "20px" }}>
                <li>
                  Tax ({tax}%): €
                  {previewData.taxAmount.toFixed(2)}
                </li>
                <li>
                  Pension ({pension}%): €
                  {previewData.pensionAmount.toFixed(2)}
                </li>
                <li>
                  Unemployment ({unemployment}%): €
                  {previewData.unemploymentAmount.toFixed(2)}
                </li>
              </ul>

              <p style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                💰 Net Pay: €{previewData.net.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* CENTER COLUMN — PAYROLL TABLE */}
        <div>
          <table
            border="1"
            cellPadding="6"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead style={{ background: "#f5f5f5" }}>
              <tr>
                <th>Employee</th>
                <th>Total Hours</th>
                <th>Rate (€)</th>
                <th>Total Pay (€)</th>
                <th>Status</th>
                <th>Date Paid</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {payroll.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "gray" }}>
                    No payroll data found.
                  </td>
                </tr>
              ) : (
                payroll.map((p) => (
                  <tr key={p.employeeId}>
                    <td>
                      {p.employeeName} ({p.employeeId})
                    </td>
                    <td>{p.totalHours}</td>
                    <td>{p.rate}</td>
                    <td>{p.totalPay.toFixed(2)}</td>

                    <td
                      style={{
                        color: p.status === "paid" ? "green" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {p.status.toUpperCase()}
                    </td>

                    <td>
                      {p.datePaid
                        ? new Date(p.datePaid).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      <button
                        onClick={() => toggleStatus(p.employeeId)}
                        style={{
                          background:
                            p.status === "paid" ? "#ff6666" : "#4CAF50",
                          color: "white",
                          padding: "4px 8px",
                          border: "none",
                          borderRadius: "4px",
                          marginRight: "5px",
                        }}
                      >
                        {p.status === "paid"
                          ? "Mark Unpaid"
                          : "Mark Paid"}
                      </button>

                      <button
                        onClick={() => handleGeneratePayslip(p)}
                        style={{
                          background: "#2196F3",
                          color: "white",
                          padding: "4px 8px",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        🧾 Payslip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {payroll.length > 0 && (
              <tfoot style={{ background: "#f9f9f9", fontWeight: "bold" }}>
                <tr>
                  <td colSpan="3" style={{ textAlign: "right" }}>
                    Total Payroll:
                  </td>
                  <td colSpan="4">€{totalPayroll.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* RIGHT COLUMN — CHART */}
        <div>
          {payroll.length > 0 && (
            <>
              <h3>📈 Monthly Payroll Cost Trend</h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={payroll.map((p) => ({
                      name: p.employeeName,
                      totalPay: p.totalPay,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalPay" fill="#4CAF50" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Payroll;
