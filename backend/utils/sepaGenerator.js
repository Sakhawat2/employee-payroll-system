// backend/utils/sepaGenerator.js
const { create } = require("xmlbuilder2");

/**
 * Generate SEPA Credit Transfer file (pain.001.001.03)
 * @param {Object} options
 * @param {Object} options.debtor { name, iban, bic }
 * @param {Array}  options.payments [{ employeeId, name, iban, amount, remittance }]
 * @param {String} options.executionDate "YYYY-MM-DD"
 * @param {String} options.messageId unique id
 * @returns {String} XML string
 */
function generateSepaXml({ debtor, payments, executionDate, messageId }) {
  const totalAmount = payments
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    .toFixed(2);

  const nbTx = payments.length.toString();
  const nowIso = new Date().toISOString().slice(0, 19);

  const doc = create({ version: "1.0", encoding: "UTF-8" })
    .ele("Document", {
      xmlns: "urn:iso:std:iso:20022:tech:xsd:pain.001.001.03",
    })
    .ele("CstmrCdtTrfInitn");

  // ===== Group Header =====
  const grpHdr = doc.ele("GrpHdr");
  grpHdr.ele("MsgId").txt(messageId);
  grpHdr.ele("CreDtTm").txt(nowIso);
  grpHdr.ele("NbOfTxs").txt(nbTx);
  grpHdr.ele("CtrlSum").txt(totalAmount);
  const initgPty = grpHdr.ele("InitgPty");
  initgPty.ele("Nm").txt(debtor.name || "Company");

  // ===== Payment Info =====
  const pmtInf = doc.ele("PmtInf");
  pmtInf.ele("PmtInfId").txt("PMT-" + messageId);
  pmtInf.ele("PmtMtd").txt("TRF");
  pmtInf.ele("BtchBookg").txt("true");
  pmtInf.ele("NbOfTxs").txt(nbTx);
  pmtInf.ele("CtrlSum").txt(totalAmount);

  const pmtTpInf = pmtInf.ele("PmtTpInf");
  pmtTpInf.ele("SvcLvl").ele("Cd").txt("SEPA");

  pmtInf.ele("ReqdExctnDt").txt(executionDate); // salary payment date

  const dbtr = pmtInf.ele("Dbtr");
  dbtr.ele("Nm").txt(debtor.name);

  const dbtrAcct = pmtInf.ele("DbtrAcct");
  dbtrAcct.ele("Id").ele("IBAN").txt(debtor.iban);

  const dbtrAgt = pmtInf.ele("DbtrAgt");
  dbtrAgt.ele("FinInstnId").ele("BIC").txt(debtor.bic);

  pmtInf.ele("ChrgBr").txt("SLEV"); // shared charges

  // ===== Each salary payment =====
  payments.forEach((p, idx) => {
    const cdtTrf = pmtInf.ele("CdtTrfTxInf");

    const pmtId = cdtTrf.ele("PmtId");
    pmtId
      .ele("EndToEndId")
      .txt(p.endToEndId || `SAL-${p.employeeId}-${idx + 1}`);

    const amt = cdtTrf.ele("Amt");
    amt.ele("InstdAmt", { Ccy: "EUR" }).txt(Number(p.amount).toFixed(2));

    const cdtr = cdtTrf.ele("Cdtr");
    cdtr.ele("Nm").txt(p.name);

    const cdtrAcct = cdtTrf.ele("CdtrAcct");
    cdtrAcct.ele("Id").ele("IBAN").txt(p.iban);

    const rmtInf = cdtTrf.ele("RmtInf");
    rmtInf.ele("Ustrd").txt(p.remittance || "Salary payment");
  });

  return doc.end({ prettyPrint: true });
}

module.exports = generateSepaXml;
