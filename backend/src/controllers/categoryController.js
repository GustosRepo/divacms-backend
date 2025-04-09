import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// 🔹 Get All Categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Add a New Category (Admin Only)
export const addCategory = async (req, res) => {
  const { name } = req.body;

  try {
    // Ensure only admins can add categories
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // Create category
    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error adding category", error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    // Ensure only admins can update categories
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name },
    });

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating category", error: error.message });
  }
};

// 🔹 Delete a Category (Admin Only)
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Ensure only admins can delete categories
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // Check if the category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return res.status(400).json({ message: "Cannot delete category with existing products." });
    }

    // Delete category
    await prisma.category.delete({ where: { id } });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error: error.message });
  }
};