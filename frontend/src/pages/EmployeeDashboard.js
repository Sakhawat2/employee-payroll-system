import React, { useEffect, useState } from 'react';
import api from '../api';

export default function EmployeeDashboard() {
  const [workRecords, setWorkRecords] = useState([]);
  const [payroll, setPayroll] = useState(null);

  useEffect(() => {
    fetchWorkRecords();
    fetchPayrollSummary();
  }, []);

  const fetchWorkRecords = async () => {
    try {
      const res = await api.get('/employee/work-records'); // adjust route as needed
      setWorkRecords(res.data);
    } catch (err) {
      console.error('Error fetching work records:', err);
    }
  };

  const fetchPayrollSummary = async () => {
    try {
      const res = await api.get('/employee/payroll'); // adjust route as needed
      setPayroll(res.data);
    } catch (err) {
      console.error('Error fetching payroll summary:', err);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Employee Dashboard</h2>

      <section className="mb-5">
        <h4>Work Records</h4>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Date</th>
              <th>Hours Worked</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {workRecords.map((record, index) => (
              <tr key={index}>
                <td>{record.date}</td>
                <td>{record.hours}</td>
                <td>{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h4>Payroll Summary</h4>
        {payroll ? (
          <table className="table table-bordered">
            <tbody>
              <tr><th>Basic Salary</th><td>{payroll.basic}</td></tr>
              <tr><th>Deductions</th><td>{payroll.deductions}</td></tr>
              <tr><th>Net Pay</th><td>{payroll.net}</td></tr>
            </tbody>
          </table>
        ) : (
          <p>No payroll data available.</p>
        )}
      </section>
    </div>
  );
}
