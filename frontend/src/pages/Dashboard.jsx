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
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Fetch employees
  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data || []))
      .catch((err) => console.error("Failed to fetch employees:", err));
  }, []);

  // Fetch work records
  useEffect(() => {
    fetch("http://localhost:5000/api/work-records")
      .then((res) => res.json())
      .then((data) => setWorkRecords(data || []))
      .catch((err) => console.error("Failed to fetch work records:", err));
  }, []);

  // Filter by month
  const monthlyRecords = useMemo(() => {
    return workRecords.filter((r) => r.date?.startsWith(selectedMonth));
  }, [workRecords, selectedMonth]);

  // Totals
  const totalEmployees = employees.length;
  const totalHours = monthlyRecords.reduce(
    (sum, r) => sum + Number(r.hours || 0),
    0
  );
  const totalPayroll = totalHours * 15;

  // Bar chart: Work hours per employee
  const employeeHours = useMemo(() => {
    const grouped = {};
    monthlyRecords.forEach((r) => {
      grouped[r.employeeName || "Unknown"] =
        (grouped[r.employeeName || "Unknown"] || 0) + r.hours;
    });
    return Object.entries(grouped).map(([name, hours]) => ({ name, hours }));
  }, [monthlyRecords]);

  // Line chart: payroll trend
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

  const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336"];

  return (
    <div style={pageContainer}>
      <h2 style={headerStyle}>📊 Dashboard Overview</h2>

      {/* Filter Row */}
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

      {/* 🔸 GRID LAYOUT — TWO ROWS */}
      <div style={dashboardGrid}>
        {/* Notifications */}
        <div style={notifCard}>
          <h4 style={{ margin: "0 0 8px 0" }}>⚠️ Notifications</h4>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {monthlyRecords.filter((r) => r.status === "pending").length > 0 ? (
              monthlyRecords
                .filter((r) => r.status === "pending")
                .map((r) => (
                  <li key={r._id} style={{ marginBottom: 4 }}>
                    <strong>{r.employeeName}</strong> has a pending work record
                    on <em>{r.date}</em>.
                  </li>
                ))
            ) : (
              <li style={{ color: "green" }}>✅ No pending approvals.</li>
            )}
          </ul>
        </div>

        {/* Summary Cards */}
        <SummaryCard
          title="Total Employees"
          value={totalEmployees}
          color="#E3F2FD"
          icon="👥"
        />
        <SummaryCard
          title="Total Work Hours"
          value={totalHours.toFixed(2)}
          color="#E8F5E9"
          icon="⏱️"
        />
        <SummaryCard
          title="Total Payroll"
          value={`€${totalPayroll.toFixed(2)}`}
          color="#FFF3E0"
          icon="💶"
        />

        {/* Charts Row */}
        <ChartBox title="🧑‍💼 Work Hours by Employee">
          {employeeHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={employeeHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#2196F3" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData />
          )}
        </ChartBox>

        <ChartBox title="💰 Payroll Distribution">
          {employeeHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={employeeHours}
                  dataKey="hours"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {employeeHours.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <NoData />
          )}
        </ChartBox>

        <ChartBox title="📈 Monthly Payroll Trend (Jan–Dec)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyPayrollTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4CAF50"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

/* --- COMPONENTS --- */
const SummaryCard = ({ title, value, color, icon }) => (
  <div
    style={{
      background: color,
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
      textAlign: "center",
      height: "120px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <h3 style={{ margin: 0, fontSize: "1rem" }}>
      {icon} {title}
    </h3>
    <p style={{ fontSize: "22px", fontWeight: "bold", marginTop: "8px" }}>
      {value}
    </p>
  </div>
);

const ChartBox = ({ title, children }) => (
  <div style={chartBoxStyle}>
    <h3 style={{ marginBottom: "10px" }}>{title}</h3>
    {children}
  </div>
);

const NoData = () => (
  <p style={{ textAlign: "center", color: "gray", marginTop: "30px" }}>
    No data for this month.
  </p>
);

/* --- STYLES --- */
const pageContainer = {
  padding: "20px 40px",
  backgroundColor: "#f9fafc",
  minHeight: "100vh",
  width: "100%",
};

const headerStyle = {
  fontWeight: "700",
  marginBottom: "15px",
  color: "#1e293b",
};

const filterRow = {
  marginBottom: "15px",
};

const dashboardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)", // 4 columns for notifications + 3 cards
  gap: "25px",
  rowGap: "30px",
  gridAutoRows: "minmax(120px, auto)",
  alignItems: "stretch",
};

const notifCard = {
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  padding: "15px 20px",
  gridColumn: "span 1",
  height: "120px",
  overflowY: "auto",
};

const chartBoxStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
  gridColumn: "span 1",
};

export default Dashboard;
