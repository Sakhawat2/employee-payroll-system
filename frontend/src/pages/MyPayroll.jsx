import { useState, useEffect } from "react";
import { generatePayslip } from "../utils/generatePayslip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TAX_RATE = 14.5;
const PENSION_RATE = 7.15;
const UNEMP_RATE = 0.59;

function MyPayroll() {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(false);

  // cache by month+mode (approved/all)
  const [historyCache, setHistoryCache] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMonth, setPreviewMonth] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);

  // NEW: approved-only toggle + sparkline data
  const [approvedOnly, setApprovedOnly] = useState(false);
  const [sparkData, setSparkData] = useState([]);
  const [sparkLoading, setSparkLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

const makeCacheKey = (month) =>
  `${user.employeeId}_${month}_${approvedOnly ? "approved" : "all"}`;



  const buildMonthValue = (year, monthIndex) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  /* -----------------------------------------------------------
     Fetch payroll data for a given month (from work-records)
     Uses same logic as WorkRecords (sum of hours), plus
     filtering by approvedOnly when enabled.
  -------------------------------------------------------------*/
  const fetchPayrollForMonth = async (month) => {
    if (!month) return null;

    const cacheKey = makeCacheKey(month);
    if (historyCache[cacheKey]) return historyCache[cacheKey];

    try {
      const res = await fetch(
        `http://localhost:5000/api/work-records/by-month?month=${month}`,
        { headers: getAuthHeaders() }
      );
      const records = await res.json();
      if (!Array.isArray(records)) return null;

      const filtered = approvedOnly
        ? records.filter((r) => r.status === "approved")
        : records;

      const totalHours = filtered.reduce(
        (sum, r) => sum + (r.hours || 0),
        0
      );

      //const user = JSON.parse(localStorage.getItem("user") || "{}");

      const result = {
        employeeId: user.employeeId,
        employeeName: user.name,
        month,
        rate: user.hourlyRate || 15,
        totalHours,
        totalPay: totalHours * (user.hourlyRate || 15),
      };

      setHistoryCache((prev) => ({ ...prev, [cacheKey]: result }));
      return result;
    } catch (err) {
      console.error("Error fetching payroll:", err);
      return null;
    }
  };

  const handleLoadCurrent = async () => {
    if (!selectedMonth) return;
    setLoading(true);
    const data = await fetchPayrollForMonth(selectedMonth);
    setPayroll(data || null);
    setLoading(false);
  };

  const handleDownloadCurrent = async () => {
    if (!selectedMonth) return;
    const data = payroll || (await fetchPayrollForMonth(selectedMonth));
    if (!data) return;
    downloadPayslipPDF(data, selectedMonth);
  };

  const downloadPayslipPDF = (data, month) => {
    const company = {
      name: "Centria Payroll Systems Oy",
      address: "Niemenkatu 10 B",
      city: "68600 Pietarsaari, Finland",
      businessId: "FI-1234567-8",
      logo: "/logo.png",
    };

    generatePayslip(data, company, {
      period: month,
      payday: new Date().toLocaleDateString(),
      rate: data.rate,
      totalHours: data.totalHours,
      totalPay: data.totalPay,
      deductions: {
        tax: TAX_RATE,
        pension: PENSION_RATE,
        unemployment: UNEMP_RATE,
      },
    });
  };

  const openPreviewForMonth = async (month) => {
    const data = await fetchPayrollForMonth(month);
    if (!data) return;
    setPayroll(data);
    setSelectedMonth(month);
    setPreviewMonth(month);
    setPreviewOpen(true);
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (let i = 0; i < 12; i++) {
        const m = buildMonthValue(selectedYear, i);
        const data = await fetchPayrollForMonth(m);
        if (!data) continue;
        if (!data.totalHours || data.totalHours === 0) continue;
        downloadPayslipPDF(data, m);
      }
    } catch (err) {
      console.error("Download error:", err);
    }
    setDownloadingAll(false);
  };

  // Recompute summary when approvedOnly changes
  useEffect(() => {
    const refresh = async () => {
      if (!selectedMonth) return;
      setLoading(true);
      const data = await fetchPayrollForMonth(selectedMonth);
      setPayroll(data || null);
      setLoading(false);
    };
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedOnly]);

  // Build sparkline data when year or approvedOnly changes
  useEffect(() => {
    const buildSpark = async () => {
      setSparkLoading(true);
      const arr = [];
      for (let i = 0; i < 12; i++) {
        const m = buildMonthValue(selectedYear, i);
        const data = await fetchPayrollForMonth(m);
        arr.push({
          label: MONTH_SHORT[i],
          hours: data?.totalHours || 0,
        });
      }
      setSparkData(arr);
      setSparkLoading(false);
    };
    buildSpark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, approvedOnly]);

  const breakdown = payroll
    ? (() => {
        const gross = payroll.totalPay || 0;
        const taxAmount = (gross * TAX_RATE) / 100;
        const pensionAmount = (gross * PENSION_RATE) / 100;
        const unemploymentAmount = (gross * UNEMP_RATE) / 100;
        const totalDeductions =
          taxAmount + pensionAmount + unemploymentAmount;
        const net = gross - totalDeductions;
        return {
          gross,
          taxAmount,
          pensionAmount,
          unemploymentAmount,
          totalDeductions,
          net,
        };
      })()
    : null;

  return (
    <div style={{ padding: "25px 30px" }}>
      <h2 style={{ marginBottom: "20px" }}>My Payslip</h2>

      {/* 3-column layout: Summary | History | Sparkline */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1.1fr 1fr",
          gap: "25px",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: Summary */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "20px 25px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginBottom: "20px" }}>Payslip Summary</h3>

          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: "18px",
              alignItems: "flex-end",
              flexWrap: "wrap",
              marginBottom: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ marginBottom: "6px", fontWeight: 500 }}>
                Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "1rem",
                  minWidth: "190px",
                }}
              />
            </div>

            <button
              onClick={handleLoadCurrent}
              style={{
                height: "40px",
                padding: "0 18px",
                background: "#1976d2",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              {loading ? "Loading..." : "Load Payroll"}
            </button>

            <button
              onClick={handleDownloadCurrent}
              disabled={!selectedMonth}
              style={{
                height: "40px",
                padding: "0 18px",
                background: selectedMonth ? "#2196F3" : "#90caf9",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.95rem",
                cursor: selectedMonth ? "pointer" : "not-allowed",
              }}
            >
              Download Payslip (PDF)
            </button>
          </div>

          {/* Approved-only toggle */}
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.9rem",
                color: "#555",
              }}
            >
              <input
                type="checkbox"
                checked={approvedOnly}
                onChange={(e) => setApprovedOnly(e.target.checked)}
              />
              Use approved hours only
            </label>
          </div>

          {!loading && !payroll && (
            <p style={{ color: "#777" }}>
              Select a month and click “Load Payroll” to see your payslip
              details.
            </p>
          )}

          {payroll && (
            <>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "15px 18px",
                  borderRadius: "10px",
                  marginBottom: "18px",
                }}
              >
                <p>
                  <strong>Name:</strong> {payroll.employeeName}
                </p>
                <p>
                  <strong>Month:</strong> {selectedMonth}
                </p>
                <p>
                  <strong>Total Hours:</strong> {payroll.totalHours}
                </p>
                <p>
                  <strong>Hourly Rate:</strong> €{payroll.rate}
                </p>
                <p>
                  <strong>Gross Pay:</strong>{" "}
                  <span style={{ fontWeight: 600 }}>
                    €{(payroll.totalPay || 0).toFixed(2)}
                  </span>
                </p>
              </div>

              {breakdown && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    padding: "15px 18px",
                    borderRadius: "10px",
                    maxWidth: "420px",
                  }}
                >
                  <h4 style={{ marginBottom: "10px" }}>
                    Salary Breakdown
                  </h4>
                  <p>
                    <strong>Gross Pay:</strong> €
                    {breakdown.gross.toFixed(2)}
                  </p>
                  <p>
                    Tax ({TAX_RATE}%): €
                    {breakdown.taxAmount.toFixed(2)}
                  </p>
                  <p>
                    Pension ({PENSION_RATE}%): €
                    {breakdown.pensionAmount.toFixed(2)}
                  </p>
                  <p>
                    Unemployment ({UNEMP_RATE}%): €
                    {breakdown.unemploymentAmount.toFixed(2)}
                  </p>
                  <p style={{ marginTop: "8px", fontWeight: 600 }}>
                    Net Pay: €{breakdown.net.toFixed(2)}
                  </p>

                  <button
                    onClick={() => {
                      setPreviewMonth(selectedMonth);
                      setPreviewOpen(true);
                    }}
                    style={{
                      marginTop: "10px",
                      padding: "8px 14px",
                      background: "#4caf50",
                      borderRadius: "8px",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Open Preview
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* MIDDLE: History */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "20px 25px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3>Payslip History</h3>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label style={{ fontWeight: 500 }}>
                Year:
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(parseInt(e.target.value))
                  }
                  style={{
                    marginLeft: "8px",
                    padding: "6px 8px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value={currentYear - 1}>{currentYear - 1}</option>
                  <option value={currentYear}>{currentYear}</option>
                  <option value={currentYear + 1}>{currentYear + 1}</option>
                </select>
              </label>

              <button
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                style={{
                  padding: "8px 14px",
                  background: downloadingAll ? "#90caf9" : "#1976d2",
                  borderRadius: "8px",
                  border: "none",
                  color: "white",
                  cursor: downloadingAll ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {downloadingAll ? "Downloading..." : "Download All"}
              </button>
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.92rem",
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ padding: "8px", textAlign: "left" }}>Month</th>
                <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "8px", textAlign: "left" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {MONTH_NAMES.map((name, idx) => {
                const m = buildMonthValue(selectedYear, idx);
                const cacheKey = makeCacheKey(m);
                const cached = historyCache[cacheKey];
                const hasHours =
                  cached && cached.totalHours && cached.totalHours > 0;

                return (
                  <tr key={m}>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {name} {selectedYear}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {cached
                        ? hasHours
                          ? "Available"
                          : "No records"
                        : "Not loaded"}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => openPreviewForMonth(m)}
                        style={{
                          padding: "5px 10px",
                          background: "#e3f2fd",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={async () => {
                          const data =
                            historyCache[cacheKey] ||
                            (await fetchPayrollForMonth(m));
                          if (!data || !data.totalHours) return;
                          downloadPayslipPDF(data, m);
                        }}
                        style={{
                          padding: "5px 10px",
                          background: "#2196F3",
                          borderRadius: "6px",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RIGHT: Sparkline chart */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "20px 22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginBottom: "8px" }}>Monthly Hours Trend</h3>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 10 }}>
            Year: {selectedYear} •{" "}
            {approvedOnly ? "Approved hours only" : "All hours"}
          </p>

          {sparkLoading ? (
            <p style={{ color: "#777" }}>Loading chart…</p>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#1976d2"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && payroll && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "20px 24px",
              minWidth: "320px",
              maxWidth: "480px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "10px" }}>
              Payslip Preview ({previewMonth || selectedMonth})
            </h3>
            <p>
              <strong>Name:</strong> {payroll.employeeName}
            </p>
            <p>
              <strong>Total Hours:</strong> {payroll.totalHours}
            </p>
            {breakdown && (
              <>
                <p>
                  <strong>Gross Pay:</strong> €
                  {breakdown.gross.toFixed(2)}
                </p>
                <p>
                  Tax ({TAX_RATE}%): €
                  {breakdown.taxAmount.toFixed(2)}
                </p>
                <p>
                  Pension ({PENSION_RATE}%): €
                  {breakdown.pensionAmount.toFixed(2)}
                </p>
                <p>
                  Unemployment ({UNEMP_RATE}%): €
                  {breakdown.unemploymentAmount.toFixed(2)}
                </p>
                <p style={{ marginTop: "6px", fontWeight: 600 }}>
                  Net Pay: €{breakdown.net.toFixed(2)}
                </p>
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              <button
                onClick={() => setPreviewOpen(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                onClick={() =>
                  downloadPayslipPDF(
                    payroll,
                    previewMonth || selectedMonth
                  )
                }
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2196F3",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPayroll;
