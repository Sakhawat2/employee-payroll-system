const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Employee.findById(decoded.id);
    if (!user) return res.status(401).json({ error: "Invalid token user" });

    req.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (err) {
    console.error("❌ Auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = verifyToken;
