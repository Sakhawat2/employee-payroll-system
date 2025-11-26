import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function generatePayslip(employee, company, payrollData) {
  const doc = new jsPDF();

  // Load logo if available
  try {
    if (company.logo) {
      const img = await loadImage(company.logo);
      doc.addImage(img, "PNG", 15, 10, 25, 25);
    }
  } catch (err) {
    console.warn("Logo could not be loaded:", err.message);
  }

  // Company info
  doc.setFontSize(14);
  doc.text(company.name || "Company Name", 45, 15);
  doc.setFontSize(10);
  doc.text(company.address || "", 45, 20);
  doc.text(company.city || "", 45, 25);
  if (company.businessId)
    doc.text(`Business ID: ${company.businessId}`, 45, 30);

  // Title
  doc.setFontSize(14);
  doc.text("PAYSLIP / CERTIFICATE OF PAY", 130, 15);
  doc.setFontSize(10);

  // Employee section
  let y = 50;
  doc.text("Employee Details", 15, y);
  autoTable(doc, {
    startY: y + 2,
    head: [["Field", "Details"]],
    body: [
      ["Employee Name", employee.employeeName],
      ["Employee ID", employee.employeeId],
      ["Address", employee.address || "-"],
      ["Pay Period", payrollData.period || "-"],
      ["Pay Date", payrollData.payday || "-"],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });

  // Payroll info
  const rate = payrollData.rate || 0;
  const totalHours = payrollData.totalHours || 0;
  const totalPay = payrollData.totalPay || 0;

  const currency = "€";

  let afterEmp = doc.lastAutoTable.finalY + 10;
  doc.text("Earnings Summary", 15, afterEmp);

  autoTable(doc, {
    startY: afterEmp + 2,
    head: [["Description", "Hours", "Rate", "Total"]],
    body: [
      [
        "Basic Pay",
        totalHours.toFixed(2),
        `${currency}${rate.toFixed(2)}`,
        `${currency}${totalPay.toFixed(2)}`
      ]
    ],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // Deductions
  const { tax = 14.5, pension = 7.15, unemployment = 0.59 } =
    payrollData.deductions || {};

  const taxAmount = (totalPay * tax) / 100;
  const pensionAmount = (totalPay * pension) / 100;
  const unemploymentAmount = (totalPay * unemployment) / 100;

  const totalDeductions =
    taxAmount + pensionAmount + unemploymentAmount;

  const netPay = totalPay - totalDeductions;

  const afterEarnings = doc.lastAutoTable.finalY + 10;
  doc.text("Deductions", 15, afterEarnings);

  autoTable(doc, {
    startY: afterEarnings + 2,
    head: [["Description", "Amount"]],
    body: [
      [`Withholding Tax (${tax}%)`, `${currency}${taxAmount.toFixed(2)}`],
      [`Pension Contribution (${pension}%)`, `${currency}${pensionAmount.toFixed(2)}`],
      [`Unemployment Insurance (${unemployment}%)`, `${currency}${unemploymentAmount.toFixed(2)}`],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // Summary table
  const afterDed = doc.lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: afterDed,
    head: [["Total Earnings", "Total Deductions", "Net Pay"]],
    body: [
      [
        `${currency}${totalPay.toFixed(2)}`,
        `${currency}${totalDeductions.toFixed(2)}`,
        `${currency}${netPay.toFixed(2)}`
      ]
    ],
    theme: "grid",
    styles: { fontSize: 11, halign: "center" },
  });

  // Footer
  const afterSummary = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.text(`Net Pay in Words: ${netPay.toFixed(2)} EUR`, 15, afterSummary);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, afterSummary + 6);

  doc.setFontSize(9);
  doc.text(company.name || "Company Name", 15, 285);
  doc.text(company.address || "", 15, 290);
  if (company.businessId)
    doc.text(`Business ID: ${company.businessId}`, 15, 295);

  doc.save(`Payslip_${employee.employeeId}_${payrollData.period}.pdf`);
}

// Convert image to base64
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}
