import supabase from "../../supabaseClient.js";


// Helper to map DB row to API shape (camelCase)
const mapProductRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    bestSeller: row.best_seller,
    brandSegment: row.brand_segment || row.brandSegment, // ensure camelCase
    categorySlug: row.category_slug || row.categorySlug,
    category: row.category ? { id: row.category.id, name: row.category.name } : null,
  };
};


// ↓↓↓ ADD THIS EXPORT ↓↓↓
export const decrementProductQuantity = async (productId, qty = 1) => {
  const n = Number.parseInt(String(qty), 10);
  const pQty = Number.isFinite(n) && n > 0 ? n : 1;

  try {
    // First attempt: call the DB RPC if it exists (preferred for atomic decrement)
    try {
      const { data, error } = await supabase.rpc("decrement_product_quantity", {
        p_id: productId,
        p_qty: pQty,
      });
      if (error) {
        // Log but don't immediately fail — we'll attempt a fallback below
        console.warn("⚠️ decrement_product_quantity RPC returned error:", error);
      } else {
        // RPC succeeded (data may be returned depending on implementation)
        return { data, error: null };
      }
    } catch (rpcEx) {
      console.warn("⚠️ decrement_product_quantity RPC threw exception:", rpcEx?.message || rpcEx);
    }

    // Fallback: read current quantity and update it safely
    // Note: This is not perfectly atomic across multiple concurrent requests but works as a robust fallback.
    const { data: product, error: selectErr } = await supabase
      .from("product")
      .select("quantity")
      .eq("id", productId)
      .single();

    if (selectErr) {
      console.error("❌ Failed to fetch product for quantity decrement:", selectErr);
      return { data: null, error: selectErr };
    }

    const currentQty = Number.isFinite(Number(product?.quantity)) ? Number(product.quantity) : 0;
    const newQty = Math.max(0, currentQty - pQty);

    const { data: updated, error: updateErr } = await supabase
      .from("product")
      .update({ quantity: newQty })
      .eq("id", productId)
      .select()
      .single();

    if (updateErr) {
      console.error("❌ Failed to update product quantity:", updateErr);
      return { data: null, error: updateErr };
    }

    return { data: updated, error: null };
  } catch (err) {
    console.error("❌ decrementProductQuantity unexpected error:", err);
    return { data: null, error: err };
  }
};
// ↑↑↑ ADD THIS EXPORT ↑↑↑



// Upload image to Supabase Storage
const uploadToSupabase = async (file) => {
  if (!file || !file.buffer) throw new Error("Invalid file data provided.");
  const fileName = `uploads/${Date.now()}-${file.originalname}`;
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });
  if (error) throw error;
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${fileName}`;
};

// 🔹 Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: product } = await supabase
      .from("product")
      .select("*, category:category!product_category_id_fkey(id, name)")
      .eq("id", id)
      .single();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getBestSellers = async (_req, res) => {
  try {
    const { data: bestSellers } = await supabase
      .from("product")
      .select("*")
      .eq("best_seller", true);

    if (!bestSellers || bestSellers.length === 0) {
      return res.status(404).json({ message: "No best-sellers available" }); // ✅ More descriptive error
    }

    res.json(bestSellers); // ✅ Correct response format
  } catch (error) {
    console.error("Error fetching best-sellers:", error);
    res.status(500).json({ error: "Failed to fetch best-sellers" });
  }
};

// 🔹 Fetch all products with pagination, filtering, search, and sorting
export const getAllProducts = async (req, res) => {
  try {
    let { categoryId, minPrice, maxPrice, search, sort, page = 1, limit = 10, brand_segment, brandSegment, category: categorySlug, category_slug, categorySlug: qsCategorySlug } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({ message: "Page and limit must be positive numbers." });
    }

    const effectiveBrand = (brand_segment || brandSegment || '').trim().toLowerCase();
    const rawCategorySlug = (categorySlug || category_slug || qsCategorySlug || '').trim().toLowerCase();

    const CATEGORY_SYNONYMS = {
      'vinyl-figures': ['vinyl'],
      'blind-boxes': ['blind-box'],
      'limited-editions': ['limited'],
      'limited-drops': ['limited'],
      'signature-sets': ['signature'],
      'statement-pieces': ['statement'],
      'everyday-essentials': ['everyday'],
      'custom-orders': ['custom'],
      'seasonal-highlights': ['seasonal']
    };
    const getCategorySlugVariants = (slug) => {
      if (!slug) return [];
      const base = slug.split('-')[0];
      const variants = new Set([slug]);
      if (base && base !== slug) variants.add(base);
      if (CATEGORY_SYNONYMS[slug]) CATEGORY_SYNONYMS[slug].forEach(s => variants.add(s));
      Object.entries(CATEGORY_SYNONYMS).forEach(([full, shorts]) => { if (shorts.includes(slug)) variants.add(full); });
      return Array.from(variants);
    };
    const categoryVariants = getCategorySlugVariants(rawCategorySlug);

    let query = supabase
      .from("product")
      .select("id, title, description, price, best_seller, image, quantity, brand_segment, category_slug, category:category!product_category_id_fkey(id, name)");

    if (categoryId) query = query.eq("category_id", categoryId);
    if (effectiveBrand) query = query.eq("brand_segment", effectiveBrand);
    if (rawCategorySlug) {
      if (categoryVariants.length > 1) query = query.in('category_slug', categoryVariants);
      else query = query.eq('category_slug', rawCategorySlug);
    }
    if (minPrice) query = query.gte("price", parseFloat(minPrice));
    if (maxPrice) query = query.lte("price", parseFloat(maxPrice));
    if (search) query = query.ilike("title", `%${search}%`);

    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: products, error } = await query;
    if (error) throw error;

    // Defensive post-filter (in case query builder .in() was ignored or variants mismatch)
    let filtered = products || [];
    let postFilterApplied = false;
    if (rawCategorySlug && categoryVariants.length) {
      const before = filtered.length;
      filtered = filtered.filter(p => categoryVariants.includes((p.category_slug || '').toLowerCase()));
      if (filtered.length !== before) postFilterApplied = true;
    }

    // Total count respecting our final filtered set (simpler fallback)
    const totalProducts = filtered.length;

    res.json({
      page,
      limit,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      products: filtered.map(mapProductRow),
      _debug: {
        rawCategorySlug,
        categoryVariants,
        postFilterApplied,
        receivedCount: (products || []).length,
        effectiveBrand,
      }
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔹 Add a new product (Admin only)
export const addProduct = async (req, res) => {
  const {
    title,
    description,
    price,
    // categoryId, // deprecated for slug-based selection
    quantity,
    bestSeller,
    brandSegment, // new camelCase
    brand_segment, // fallback snake / query style
    categorySlug, // new camelCase
    category_slug, // fallback
    // NEW shipping fields
    weightOz,
    lengthIn,
    widthIn,
    heightIn,
  } = req.body;

  const file = req.file;

  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    if (!title || price == null) {
      return res.status(400).json({ message: "title and price are required" });
    }

    let imageUrl = null;
    if (file) {
      imageUrl = await uploadToSupabase(file);
    }

    // Direct usage of provided brand & category slug (no category table lookup)
    let effectiveBrandSegment = (brandSegment || brand_segment || '').trim().toLowerCase();
    let effectiveCategorySlug = (categorySlug || category_slug || '').trim().toLowerCase();

    // Enforce NOT NULL columns (per schema)
    if (!effectiveBrandSegment) {
      return res.status(400).json({ message: 'brandSegment required' });
    }
    if (!effectiveCategorySlug) {
      return res.status(400).json({ message: 'categorySlug required' });
    }
    if (!ALLOWED_BRANDS.has(effectiveBrandSegment)) {
      return res.status(400).json({ message: 'Invalid brandSegment' });
    }

    const insertData = {
      title,
      description: description ?? "",
      price: Number(price),
      image: imageUrl,
      quantity: quantity != null ? parseInt(quantity, 10) : 0,
      best_seller: bestSeller === "true" || bestSeller === true,
      // shipping fields
      weight_oz:
        weightOz !== undefined && weightOz !== null && `${weightOz}` !== ""
          ? Math.max(0, parseInt(weightOz, 10))
          : null,
      length_in:
        lengthIn !== undefined && lengthIn !== null && `${lengthIn}` !== ""
          ? Number(lengthIn)
          : null,
      width_in:
        widthIn !== undefined && widthIn !== null && `${widthIn}` !== ""
          ? Number(widthIn)
          : null,
      height_in:
        heightIn !== undefined && heightIn !== null && `${heightIn}` !== ""
          ? Number(heightIn)
          : null,
      brand_segment: effectiveBrandSegment,
      category_slug: effectiveCategorySlug,
    };

    const { data: product, error } = await supabase
      .from("product")
      .insert(insertData)
      .select("*, category:category!product_category_id_fkey(id, name)")
      .single();

    if (error) throw error;
    res.status(201).json(mapProductRow(product));
  } catch (error) {
    console.error("❌ Error adding product:", error);
    res.status(500).json({ message: "Error adding product", error: error.message });
  }
};
// 🔹 Update product (Admin only)
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    title, description, price, /*categoryId,*/ bestSeller, quantity,
    brandSegment, brand_segment, categorySlug, category_slug,
    // NEW:
    weightOz, lengthIn, widthIn, heightIn,
  } = req.body;
  // const image = req.file ? `/uploads/${req.file.filename}` : undefined;
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    // Simplified: rely only on provided brand & category slug; if absent, preserve existing values
    let effectiveBrandSegment = (brandSegment || brand_segment || '').trim().toLowerCase();
    let effectiveCategorySlug = (categorySlug || category_slug || '').trim().toLowerCase();

    // Fetch existing product to preserve required fields when not explicitly provided
    if (!effectiveBrandSegment || !effectiveCategorySlug) {
      const { data: existing, error: existingErr } = await supabase.from('product').select('brand_segment, category_slug').eq('id', id).single();
      if (existingErr) {
        return res.status(400).json({ message: 'Product not found for update' });
      }
      if (!effectiveBrandSegment) effectiveBrandSegment = existing.brand_segment;
      if (!effectiveCategorySlug) effectiveCategorySlug = existing.category_slug;
    }

    if (!effectiveBrandSegment) return res.status(400).json({ message: 'brandSegment required' });
    if (!effectiveCategorySlug) return res.status(400).json({ message: 'categorySlug required' });
    if (!ALLOWED_BRANDS.has(effectiveBrandSegment)) {
      return res.status(400).json({ message: 'Invalid brandSegment' });
    }

    const updateData = {
      ...(title != null ? { title } : {}),
      ...(description != null ? { description } : {}),
      ...(price != null ? { price: parseFloat(price) } : {}),
      // ...(categoryId != null ? { category_id: categoryId } : {}), // deprecated
      ...(bestSeller != null ? { best_seller: bestSeller === true || bestSeller === "true" } : {}),
      ...(quantity != null ? { quantity: parseInt(quantity, 10) } : {}),
      ...(req.file ? { image: `/uploads/${req.file.filename}` } : {}),
      // shipping
      ...(weightOz != null ? { weight_oz: Math.max(0, parseInt(weightOz, 10)) } : {}),
      ...(lengthIn != null ? { length_in: Number(lengthIn) } : {}),
      ...(widthIn  != null ? { width_in:  Number(widthIn) } : {}),
      ...(heightIn != null ? { height_in: Number(heightIn) } : {}),
      brand_segment: effectiveBrandSegment,
      category_slug: effectiveCategorySlug,
    };

    const { data: updatedProduct, error } = await supabase
      .from("product")
      .update(updateData)
      .eq("id", id)
      .select("*, category:category!product_category_id_fkey(id, name)")
      .single();
    if (error) throw error;
    res.json(mapProductRow(updatedProduct));
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
};

// 🔹 Fetch products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    // Validate category existence
    const { data: category } = await supabase
      .from("category")
      .select("*")
      .eq("id", categoryId)
      .single();
    if (!category) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    // Fetch products by categoryId
    const { data: products, error } = await supabase
      .from("product")
      .select("*, category:category!product_category_id_fkey(id, name)")
      .eq("categoryId", categoryId);
    if (error) throw error;
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products by category", error: error.message });
  }
};

// 🔹 Delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    const { error } = await supabase
      .from("product")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error.message });
  }
};

// ↓↓↓ ADD THIS EXPORT ↓↓↓
export const incrementProductQuantity = async (productId, qty = 1) => {
  const n = Number.parseInt(String(qty), 10);
  const inc = Number.isFinite(n) && n > 0 ? n : 1;
  try {
    const { data: product, error: selectErr } = await supabase
      .from("product")
      .select("quantity")
      .eq("id", productId)
      .single();
    if (selectErr) {
      console.error("❌ Failed to fetch product for increment:", selectErr);
      return { data: null, error: selectErr };
    }
    const current = Number.isFinite(Number(product?.quantity)) ? Number(product.quantity) : 0;
    const { data: updated, error: updateErr } = await supabase
      .from("product")
      .update({ quantity: current + inc })
      .eq("id", productId)
      .select()
      .single();
    if (updateErr) {
      console.error("❌ Failed to increment product quantity:", updateErr);
      return { data: null, error: updateErr };
    }
    return { data: updated, error: null };
  } catch (err) {
    console.error("❌ incrementProductQuantity unexpected error:", err);
    return { data: null, error: err };
  }
};
// ↑↑↑ ADD THIS EXPORT ↑↑↑

const ALLOWED_BRANDS = new Set(["nails", "toys", "accessories"]);

// Validate brand_segment against allowed set
export const validateBrandSegment = (req, res, next) => {
  const { brandSegment, brand_segment } = req.body;
  const effectiveBrandSegment = (brandSegment || brand_segment || '').trim();
  if (effectiveBrandSegment && !ALLOWED_BRANDS.has(effectiveBrandSegment.toLowerCase())) {
    return res.status(400).json({ message: "Invalid brandSegment" });
  }
  next();
};

// ✅ File restored after truncation