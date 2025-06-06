import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // Secure this in production

// 🔹 Register a new user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "customer" },
    });

    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔹 Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role , isAdmin: user.role === "admin" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin: user.role === "admin" },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔹 Promote User to Admin (Admin-Only)
export const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: "admin" },
    });

    res.json({ message: "User promoted to admin", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};