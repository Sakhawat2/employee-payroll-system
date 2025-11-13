import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [workRecords, setWorkRecords] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  /* =========================================================
     🔹 Fetch Employees
  ========================================================= */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/employees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEmployees(data || []);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        setError("Error loading employees");
      }
    };
    fetchEmployees();
  }, [token]);

  /* =========================================================
     🔹 Fetch Work Records
  ========================================================= */
  useEffect(() => {
    const fetchWorkRecords = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/work-records", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setWorkRecords(data || []);
      } catch (err) {
        console.error("Failed to fetch work records:", err);
        setError("Error loading work records");
      }
    };
    fetchWorkRecords();
  }, [token]);

  /* =========================================================
     🔹 Fetch Holidays (for leave notifications)
  ========================================================= */
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/holidays", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setHolidays(data || []);
      } catch (err) {
        console.error("Failed to fetch holidays:", err);
      }
    };
    fetchHolidays();
  }, [token]);

  /* =========================================================
     🔹 Monthly Filter
  ========================================================= */
  const monthlyRecords = useMemo(() => {
    if (!Array.isArray(workRecords)) return [];
    return workRecords.filter((r) => r.date?.startsWith(selectedMonth));
  }, [workRecords, selectedMonth]);

  /* =========================================================
     🔹 Totals and Stats
  ========================================================= */
  const totalEmployees = employees.length;
  const totalHours = monthlyRecords.reduce(
    (sum, r) => sum + Number(r.hours || 0),
    0
  );
  const totalPayroll = totalHours * 15;

  const totalHolidays = holidays.filter((h) =>
    h.startDate?.startsWith(selectedMonth)
  );
  const pendingLeaves = totalHolidays.filter((h) => h.status === "Pending");
  const approvedLeaves = totalHolidays.filter((h) => h.status === "Approved");
  const rejectedLeaves = totalHolidays.filter((h) => h.status === "Rejected");

  /* =========================================================
     🔹 Bar Chart: Work Hours per Employee
  ========================================================= */
  const employeeHours = useMemo(() => {
    const grouped = {};
    monthlyRecords.forEach((r) => {
      grouped[r.employeeName || "Unknown"] =
        (grouped[r.employeeName || "Unknown"] || 0) + r.hours;
    });
    return Object.entries(grouped).map(([name, hours]) => ({ name, hours }));
  }, [monthlyRecords]);

  /* =========================================================
     🔹 Payroll Trend Chart
  ========================================================= */
  const monthlyPayrollTrend = useMemo(() => {
    const trend = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i).toLocaleString("en-US", { month: "short" }),
      total: 0,
    }));
    workRecords.forEach((r) => {
      const date = new Date(r.date);
      if (!isNaN(date)) {
        trend[date.getMonth()].total += (r.hours || 0) * 15;
      }
    });
    return trend;
  }, [workRecords]);

  /* =========================================================
     🔹 Top & Bottom Performer
  ========================================================= */
  const mostActive = employeeHours.length
    ? employeeHours.reduce((a, b) => (a.hours > b.hours ? a : b))
    : null;
  const leastActive = employeeHours.length
    ? employeeHours.reduce((a, b) => (a.hours < b.hours ? a : b))
    : null;

  const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336"];

  /* =========================================================
     🔹 Recent Activity Feed
  ========================================================= */
  const recentActivities = [
    ...monthlyRecords
      .slice(-3)
      .map((r) => ({
        message: `🕓 ${r.employeeName} logged ${r.hours}h on ${r.date}`,
        date: r.date,
      })),
    ...pendingLeaves
      .slice(-2)
      .map((h) => ({
        message: `🌴 ${h.employeeName} requested leave (${h.type})`,
        date: h.startDate,
      })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  /* =========================================================
     🔹 Render
  ========================================================= */
  return (
    <div style={pageContainer}>
      <h2 style={headerStyle}>📊 Admin Dashboard Overview</h2>

      {error && (
        <p style={{ color: "red", fontWeight: "500", marginBottom: "15px" }}>
          {error}
        </p>
      )}

      <div style={filterRow}>
        <label>
          Month:{" "}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </label>
      </div>

      <div style={dashboardGrid}>
        {/* Notifications */}
        <div style={notifCard}>
          <h4 style={{ marginBottom: 8 }}>⚠️ Notifications</h4>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {pendingLeaves.length > 0 && (
              <>
                {pendingLeaves.map((h) => (
                  <li key={h._id} style={{ color: "#ff9800" }}>
                    🌴 <strong>{h.employeeName}</strong> requested{" "}
                    <em>{h.type}</em> leave ({h.startDate}–{h.endDate})
                  </li>
                ))}
              </>
            )}
            {monthlyRecords.some((r) => r.status === "pending") ? (
              monthlyRecords
                .filter((r) => r.status === "pending")
                .map((r) => (
                  <li key={r._id} style={{ color: "#ff9800" }}>
                    ⏱️ <strong>{r.employeeName}</strong> has a pending work record on{" "}
                    {r.date}
                  </li>
                ))
            ) : (
              <li style={{ color: "green" }}>✅ No pending approvals.</li>
            )}
          </ul>
        </div>

        {/* Summary Cards */}
        <SummaryCard title="Total Employees" value={totalEmployees} color="#E3F2FD" icon="👥" />
        <SummaryCard title="Total Work Hours" value={totalHours.toFixed(2)} color="#E8F5E9" icon="⏱️" />
        <SummaryCard title="Total Payroll" value={`€${totalPayroll.toFixed(2)}`} color="#FFF3E0" icon="💶" />
        <SummaryCard title="Pending Leave Requests" value={pendingLeaves.length} color="#FFF9C4" icon="🌴" />

        {/* Charts */}
        <ChartBox title="🧑‍💼 Work Hours by Employee">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={employeeHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#2196F3" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="💰 Payroll Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={employeeHours} dataKey="hours" nameKey="name" outerRadius={90} label>
                {employeeHours.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="📈 Monthly Payroll Trend (Jan–Dec)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyPayrollTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#4CAF50" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>

        {/* Activity Feed */}
        <div style={notifCard}>
          <h4>📰 Recent Activity</h4>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {recentActivities.length > 0 ? (
              recentActivities.map((a, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {a.message}
                </li>
              ))
            ) : (
              <li style={{ color: "gray" }}>No recent activity.</li>
            )}
          </ul>
        </div>

        {/* Performance Highlights */}
        <div style={notifCard}>
          <h4>🏆 Performance Highlights</h4>
          {mostActive ? (
            <>
              <p>⭐ Most Active: {mostActive.name} ({mostActive.hours}h)</p>
              <p>⚪ Least Active: {leastActive.name} ({leastActive.hours}h)</p>
              <p>🌴 Leaves Taken: {approvedLeaves.length}</p>
            </>
          ) : (
            <p style={{ color: "gray" }}>No data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Reusable Components --- */
const SummaryCard = ({ title, value, color, icon }) => (
  <div
    style={{
      background: color,
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
      textAlign: "center",
    }}
  >
    <h3 style={{ margin: 0 }}>
      {icon} {title}
    </h3>
    <p style={{ fontSize: "22px", fontWeight: "bold", marginTop: "8px" }}>{value}</p>
  </div>
);

const ChartBox = ({ title, children }) => (
  <div style={chartBoxStyle}>
    <h3 style={{ marginBottom: "10px" }}>{title}</h3>
    {children}
  </div>
);

/* --- Styles --- */
const pageContainer = {
  padding: "20px 40px",
  backgroundColor: "#f9fafc",
  minHeight: "100vh",
};

const headerStyle = { fontWeight: "700", marginBottom: "15px" };

const filterRow = { marginBottom: "15px" };

const dashboardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "25px",
  rowGap: "30px",
};

const notifCard = {
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  padding: "15px 20px",
  gridColumn: "span 1",
  minHeight: "150px",
  overflowY: "auto",
};

const chartBoxStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
};

export default Dashboard;
