import supabase from "../../supabaseClient.js";

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

    const { count: totalUsers, error: countError } = await supabase
      .from("user")
      .select("id", { count: "exact", head: true });
    if (countError) throw countError;
    const { data: users, error } = await supabase
      .from("user")
      .select("id, email, role, created_at")
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw error;

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
    const { data: user, error: findError } = await supabase
      .from("user")
      .select("*")
      .eq("id", userId)
      .single();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ Update user role
    const { data: updatedUser, error } = await supabase
      .from("user")
      .update({ role })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;

    res.json({ message: `User role updated to ${role}`, user: updatedUser });
  } catch (error) {
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

    const { error } = await supabase.from("user").delete().eq("id", userId);
    if (error) throw error;

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    const { count: totalUsers, error: userError } = await supabase
      .from("user")
      .select("id", { count: "exact", head: true });
    if (userError) throw userError;
    const { count: totalOrders, error: orderError } = await supabase
      .from("order")
      .select("id", { count: "exact", head: true });
    if (orderError) throw orderError;
    const { data: revenueData, error: revenueError } = await supabase
      .from("order")
      .select("total_amount")
      .not("total_amount", "is", null);
    if (revenueError) throw revenueError;
    const totalRevenue = revenueData.reduce(
      (sum, o) => sum + (o.total_amount || 0),
      0
    );
    res.json({ totalUsers, totalOrders, totalRevenue });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching admin stats", error: error.message });
  }
};

const mapAdminProductRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    bestSeller: row.best_seller,
    brandSegment: row.brand_segment || row.brandSegment,
    categorySlug: row.category_slug || row.categorySlug,
  };
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
      brand_segment,
      brandSegment,
      category: categorySlug,
      category_slug,
      categorySlug: qsCategorySlug,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ message: "Page and limit must be positive numbers." });
    }

    const effectiveBrand = (brand_segment || brandSegment || "").trim();
    const effectiveCategorySlug = (categorySlug || category_slug || qsCategorySlug || "").trim();

    let query = supabase.from("product").select("*, category:category!product_category_id_fkey(id, name)");
    if (categoryId) query = query.eq("category_id", categoryId);
    if (effectiveBrand) query = query.eq("brand_segment", effectiveBrand.toLowerCase());
    if (effectiveCategorySlug) query = query.eq("category_slug", effectiveCategorySlug.toLowerCase());
    if (minPrice) query = query.gte("price", parseFloat(minPrice));
    if (maxPrice) query = query.lte("price", parseFloat(maxPrice));
    if (search) query = query.ilike("title", `%${search}%`);

    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: products, error } = await query;
    if (error) throw error;

    // Count with filters
    let countQuery = supabase.from("product").select("id", { count: "exact", head: true });
    if (categoryId) countQuery = countQuery.eq("category_id", categoryId);
    if (effectiveBrand) countQuery = countQuery.eq("brand_segment", effectiveBrand.toLowerCase());
    if (effectiveCategorySlug) countQuery = countQuery.eq("category_slug", effectiveCategorySlug.toLowerCase());
    if (minPrice) countQuery = countQuery.gte("price", parseFloat(minPrice));
    if (maxPrice) countQuery = countQuery.lte("price", parseFloat(maxPrice));
    if (search) countQuery = countQuery.ilike("title", `%${search}%`);

    const { count: totalProducts, error: countError } = await countQuery;
    if (countError) throw countError;

    res.json({
      page,
      limit,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      products: (products || []).map(mapAdminProductRow),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, bestSeller, quantity, brandSegment, brand_segment, categorySlug, category_slug } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : undefined;
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    let effectiveBrandSegment = (brandSegment || brand_segment || "").trim().toLowerCase();
    let effectiveCategorySlug = (categorySlug || category_slug || "").trim().toLowerCase();

    const updateData = {
      ...(title != null ? { title } : {}),
      ...(description != null ? { description } : {}),
      ...(price != null ? { price: parseFloat(price) } : {}),
      ...(bestSeller != null ? { best_seller: bestSeller === "true" || bestSeller === true } : {}),
      ...(quantity != null ? { quantity: parseInt(quantity, 10) } : {}),
      ...(image ? { image } : {}),
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
    res.json(mapAdminProductRow(updatedProduct));
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
};