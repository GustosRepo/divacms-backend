import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// 🔹 Get All Users (Admin Only)
export const getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ message: "Page and limit must be positive numbers." });
    }

    const totalUsers = await prisma.user.count();
    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, email: true, role: true, createdAt: true },
    });

    res.json({
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// 🔹 Update User Role (Admin Only)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!["admin", "customer"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Must be 'admin' or 'customer'." });
    }

    // ✅ Ensure user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    res.json({ message: `User role updated to ${role}`, user: updatedUser });
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    res
      .status(500)
      .json({ message: "Error updating user role", error: error.message });
  }
};

// 🔹 Delete a User (Admin Only)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId === userId) {
      return res.status(403).json({ message: "You cannot delete yourself." });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.order.count();

    // ✅ CORRECTED Revenue Query
    const totalRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true }, // ✅ Using `totalAmount` from the `Order` model
    });

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0, // ✅ Fix response field
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching admin stats", error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    let {
      categoryId,
      minPrice,
      maxPrice,
      search,
      sort,
      page = 1,
      limit = 10,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ message: "Page and limit must be positive numbers." });
    }

    // Build filters dynamically
    let filters = {};
    if (categoryId) filters.categoryId = categoryId;
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.gte = parseFloat(minPrice);
      if (maxPrice) filters.price.lte = parseFloat(maxPrice);
    }
    if (search) {
      filters.title = { contains: search, mode: "insensitive" }; // Case-insensitive search
    }

    // Get total count for pagination
    const totalProducts = await prisma.product.count({ where: filters });

    // Fetch products with filters, sorting, and pagination
    const products = await prisma.product.findMany({
      where: filters,
      skip: (page - 1) * limit,
      take: limit,
      orderBy:
        sort === "price_asc"
          ? { price: "asc" }
          : sort === "price_desc"
          ? { price: "desc" }
          : { createdAt: "desc" }, // Default to newest first
      include: { category: true }, // Include category info
    });

    res.json({
      page,
      limit,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, categoryId, bestSeller } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : undefined; // ✅ Update only if new image

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // ✅ Ensure category exists
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) return res.status(400).json({ message: "Invalid category ID" });
    }

    // ✅ Update Product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { title, description, price: parseFloat(price), image, categoryId, bestSeller: bestSeller === "true" },
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
};