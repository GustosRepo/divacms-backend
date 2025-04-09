import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { Upload } from "@aws-sdk/lib-storage"; // ✅ Use recommended Upload
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // ✅ Ensure this is correctly imported
import { Readable } from "stream"; // ✅ Import Readable for Buffer conversion


import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

//upload to digital ocean spaces
// ✅ Create S3 Client for DigitalOcean Spaces
const s3 = new S3Client({
  region: process.env.DO_SPACES_REGION,
  endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

// ✅ Function to Upload a File to DigitalOcean Spaces
const uploadToSpaces = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file data provided.");
  }

  const fileStream = Readable.from(file.buffer); // ✅ Convert Buffer to Stream

  const params = {
    Bucket: process.env.DO_SPACES_NAME, // ✅ Your DO Spaces bucket name
    Key: `uploads/${Date.now()}-${file.originalname}`, // Unique filename
    Body: fileStream,
    ACL: "public-read", // ✅ Make file public
    ContentType: file.mimetype,
    ContentLength: file.buffer.length, // ✅ Set Content-Length explicitly
  };

  console.log("📤 Uploading to Spaces:", params);

  // ✅ Ensure PutObjectCommand is properly called
  const command = new PutObjectCommand(params);
  await s3.send(command);

  return `https://${process.env.DO_SPACES_NAME}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${params.Key}`;
};

// 🔹 Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }, // ✅ Include category details if needed
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getBestSellers = async (req, res) => {
  try {
    const bestSellers = await prisma.product.findMany({
      where: { bestSeller: true }, // ✅ Fetch only best sellers
    });

    if (bestSellers.length === 0) {
      return res.status(404).json({ message: "No best-sellers available" }); // ✅ More descriptive error
    }

    res.json({ bestSellers }); // ✅ Correct response format
  } catch (error) {
    console.error("Error fetching best-sellers:", error);
    res.status(500).json({ error: "Failed to fetch best-sellers" });
  }
};

// 🔹 Fetch all products with pagination, filtering, search, and sorting
export const getAllProducts = async (req, res) => {
  try {
    let { categoryId, minPrice, maxPrice, search, sort, page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({ message: "Page and limit must be positive numbers." });
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
      filters.title = { contains: search, mode: "insensitive" };
    }

    // Get total count for pagination
    const totalProducts = await prisma.product.count({ where: filters });

    // Fetch products with filters, sorting, and pagination
    const products = await prisma.product.findMany({
      where: filters,
      skip: (page - 1) * limit,
      take: limit,
      orderBy:
        sort === "price_asc" ? { price: "asc" } :
        sort === "price_desc" ? { price: "desc" } :
        { createdAt: "desc" },
      include: { 
        category: { select: { name: true } } // ✅ Fetch only category name
      },
    });

    // ✅ Clean up response: Flatten category field
    const cleanedProducts = products.map(product => ({
      ...product,
      category: product.category ? product.category.name : "No Category"
    }));

    res.json({
      page,
      limit,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      products: cleanedProducts,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔹 Add a new product (Admin only)
export const addProduct = async (req, res) => {
  const { title, description, price, categoryId, quantity } = req.body;
  const file = req.file; // ✅ Uploaded image

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // ✅ Ensure `categoryId` exists
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    let imageUrl = null;
    if (file) {
      imageUrl = await uploadToSpaces(file); // ✅ Upload to DigitalOcean Spaces
    }

    // ✅ Create product in the database
    const product = await prisma.product.create({
      data: {
        title,
        description: description || "",
        price: parseFloat(price),
        image: imageUrl, // ✅ Use Spaces URL
        categoryId,
        quantity: parseInt(quantity, 10) || 0,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("❌ Error adding product:", error);
    res.status(500).json({ message: "Error adding product", error: error.message });
  }
};
// 🔹 Update product (Admin only)
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

// 🔹 Fetch products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Validate category existence
    const category = await prisma.category.findUnique({ where: { id: categoryId } });

    if (!category) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    // Fetch products based on categoryId
    const products = await prisma.product.findMany({ where: { categoryId } });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products by category", error: error.message });
  }
};

// 🔹 Delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure only admins can delete products
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error.message });
  }
};