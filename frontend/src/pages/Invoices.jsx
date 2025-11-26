import { useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Auth headers
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [creating, setCreating] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    employeeId: "",
    month: "",
    amount: "",
    description: "",
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Fetch employees
  useEffect(() => {
    fetch("http://localhost:5000/api/employees", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  // Fetch invoices
  const loadInvoices = () => {
    fetch("http://localhost:5000/api/invoices", {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setInvoices(data))
      .catch((err) => console.error("Error fetching invoices:", err));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const text = search.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber?.toLowerCase().includes(text) ||
        inv.employeeName?.toLowerCase().includes(text) ||
        inv.month?.includes(text);

      const matchesStatus = filterStatus
        ? inv.status === filterStatus
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, filterStatus]);

  // Create invoice (single-item, VAT 0%)
  const handleCreateInvoice = async () => {
    if (!newInvoice.employeeId || !newInvoice.month || !newInvoice.amount) {
      alert("Please select employee, month and amount.");
      return;
    }

    setCreating(true);

    const payload = {
      employeeId: newInvoice.employeeId,
      month: newInvoice.month,
      amount: Number(newInvoice.amount),
      description: newInvoice.description,
    };

    try {
      const res = await fetch("http://localhost:5000/api/invoices", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to create invoice");
        setCreating(false);
        return;
      }

      setNewInvoice({
        employeeId: "",
        month: "",
        amount: "",
        description: "",
      });

      loadInvoices();
      alert("Invoice created successfully!");
    } catch (err) {
      console.error("Error creating invoice:", err);
      alert("Error creating invoice");
    }

    setCreating(false);
  };

  // Toggle paid/unpaid
  const toggleStatus = async (id, currentStatus) => {
    try {
      await fetch(`http://localhost:5000/api/invoices/${id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: currentStatus === "paid" ? "unpaid" : "paid",
        }),
      });
      loadInvoices();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update invoice status");
    }
  };

  // Delete invoice
  const deleteInvoice = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;

    try {
      await fetch(`http://localhost:5000/api/invoices/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      loadInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Failed to delete invoice");
    }
  };

  // Download PDF (server generates Finnish-style PDF)
  const downloadInvoicePDF = async (inv) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/invoices/${inv._id}/pdf`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) {
        alert("Failed to download invoice PDF");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${inv.invoiceNumber || inv._id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading invoice PDF:", err);
      alert("Error downloading invoice PDF");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📄 Invoice Management</h2>

      {/* FILTER BAR */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <input
          type="text"
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={handleCreateInvoice}
          disabled={creating}
          style={{
            background: "#4CAF50",
            color: "white",
            border: "none",
            padding: 10,
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {creating ? "Creating..." : "➕ Create Invoice"}
        </button>
      </div>

      {/* CREATE INVOICE FORM */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 15,
          borderRadius: 10,
          marginBottom: 25,
          background: "#fafafa",
        }}
      >
        <h3>Create Invoice</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          <select
            value={newInvoice.employeeId}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, employeeId: e.target.value })
            }
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.name} ({emp.employeeId})
              </option>
            ))}
          </select>

          <input
            type="month"
            value={newInvoice.month}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, month: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Amount (€)"
            value={newInvoice.amount}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, amount: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Description"
            value={newInvoice.description}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, description: e.target.value })
            }
          />
        </div>
      </div>

      {/* MAIN 2-COLUMN LAYOUT */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          gap: 25,
        }}
      >
        {/* LEFT: TABLE */}
        <div>
          <table
            border="1"
            cellPadding="7"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead style={{ background: "#f2f2f2" }}>
              <tr>
                <th>No.</th>
                <th>Employee</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 10 }}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td>{inv.invoiceNumber}</td>
                    <td>
                      {inv.employeeName} ({inv.employeeId})
                    </td>
                    <td>{inv.month}</td>
                    <td>€{(inv.total || 0).toFixed(2)}</td>
                    <td
                      style={{
                        color:
                          inv.status === "paid"
                            ? "green"
                            : inv.status === "cancelled"
                            ? "gray"
                            : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {inv.status.toUpperCase()}
                    </td>
                    <td>
                      <button
                        style={{
                          padding: "4px 8px",
                          background: "#2196F3",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          marginRight: 5,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadInvoicePDF(inv);
                        }}
                      >
                        PDF
                      </button>

                      <button
                        style={{
                          padding: "4px 8px",
                          background:
                            inv.status === "paid" ? "#d9534f" : "#4caf50",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          marginRight: 5,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(inv._id, inv.status);
                        }}
                      >
                        {inv.status === "paid" ? "Unpay" : "Pay"}
                      </button>

                      <button
                        style={{
                          padding: "4px 8px",
                          background: "#ff4444",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteInvoice(inv._id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* RIGHT: INVOICE PREVIEW */}
        <div
          style={{
            border: "1px solid #ddd",
            padding: 20,
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          {selectedInvoice ? (
            <>
              <h3>Invoice Preview</h3>
              <p>
                <strong>Invoice No:</strong> {selectedInvoice.invoiceNumber}
              </p>
              <p>
                <strong>Employee:</strong> {selectedInvoice.employeeName} (
                {selectedInvoice.employeeId})
              </p>
              <p>
                <strong>Month:</strong> {selectedInvoice.month}
              </p>
              <p>
                <strong>Amount (no VAT):</strong> €
                {(selectedInvoice.total || 0).toFixed(2)}
              </p>
              <p>
                <strong>VAT:</strong> 0% (not added)
              </p>
              <p>
                <strong>Status:</strong> {selectedInvoice.status}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {selectedInvoice.notes || selectedInvoice.description || "-"}
              </p>
            </>
          ) : (
            <p style={{ color: "#777" }}>Select an invoice to preview...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Invoices;
