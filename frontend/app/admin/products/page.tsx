"use client";

import React, { useState, useEffect } from "react";
// 1. Icons & UI Libs
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

// 2. Services
import { productService, Product } from "@/services/product.service";
import { Supplier, supplierService } from "@/services/supplier.service";
import { Category, categoryService } from "@/services/category.service";
import { uploadService } from "@/services/user.service";

// 3. Components
import AdminSearch from "../../components/admin/search";
import Pagination from "../../components/pagination";
import ProductForm from "./product-form/page";

// --- CONSTANTS ---
const INITIAL_PRODUCT: Product = {
  name: "",
  slug: "",
  sku: "",
  price: 0,
  originalPrice: 0,
  stock: 0,
  category: "",
  supplier: "",
  unit: "kg",
  thumbnail: "",
  images: [],
  shortDescription: "",
  description: "",
  origin: "",
  brand: "",
  preservation: "",
  nutrition: [],
  isAvailable: true,
};

export default function AdminProductsPage() {
  // --- A. STATE MANAGEMENT ---

  // 1. Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Form & UI State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Product>(INITIAL_PRODUCT);
  const [editId, setEditId] = useState<string | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState("");

  // 3. Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- B. API CALLS ---

  // Init Data (Categories & Suppliers)
  useEffect(() => {
    const initData = async () => {
      try {
        const [catData, supData] = await Promise.all([
          categoryService.getAll(),
          supplierService.getAll(1, 1000, ""),
        ]);
        if (Array.isArray(catData)) setCategories(catData);
        if (Array.isArray(supData.data)) setSuppliers(supData.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu ban đầu:", err);
      }
    };
    initData();
  }, []);

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getAll(page, 10, searchQuery);
      if (res && Array.isArray(res.data)) {
        setProducts(res.data);
        setTotalPages(res.lastPage);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery]);

  // --- C. HANDLERS ---

  // 1. Upload & Images
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "thumbnail" | "images"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadService.uploadImage(file);
      if (field === "thumbnail") {
        setFormData((prev) => ({ ...prev, thumbnail: url }));
      } else {
        setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
      }
    } catch (err) {
      toast.error("Lỗi upload ảnh");
    }
  };

  const handleAddUrl = () => {
    if (!tempImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, tempImageUrl],
    }));
    setTempImageUrl("");
  };

  // 2. Nutrition Logic
  const addNutritionRow = () => {
    setFormData({
      ...formData,
      nutrition: [...(formData.nutrition || []), { label: "", value: "" }],
    });
  };
  const removeNutritionRow = (index: number) => {
    const newNutrition = [...(formData.nutrition || [])];
    newNutrition.splice(index, 1);
    setFormData({ ...formData, nutrition: newNutrition });
  };
  const updateNutritionRow = (index: number, field: string, val: string) => {
    const newNutrition = [...(formData.nutrition || [])];
    // @ts-ignore
    newNutrition[index][field] = val;
    setFormData({ ...formData, nutrition: newNutrition });
  };

  // 3. Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.slug)
        formData.slug = formData.name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
      if (!formData.sku) formData.sku = "SKU-" + Date.now();

      const cleanData = {
        ...formData,
        category:
          typeof formData.category === "object" && formData.category
            ? (formData.category as any)._id
            : formData.category,
        supplier:
          typeof formData.supplier === "object" && formData.supplier
            ? (formData.supplier as any)._id
            : formData.supplier || undefined,
        nutrition: formData.nutrition?.filter((n) => n.label && n.value),
      };

      if (isEditing && editId) {
        await productService.update(editId, cleanData);
        toast.success("Cập nhật thành công!");
      } else {
        await productService.create(cleanData);
        toast.success("Thêm mới thành công!");
      }
      closeForm();
      fetchProducts();
    } catch (error) {
      toast.error("Lỗi khi lưu sản phẩm");
    }
  };

  // 4. Delete
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này không?")) {
      try {
        await productService.remove(id);
        fetchProducts();
        toast.success("Đã xóa sản phẩm");
      } catch (error) {
        toast.error("Xóa thất bại");
      }
    }
  };

  // 5. Form Control
  const handleEdit = (product: Product) => {
    setIsEditing(true);
    setEditId(product._id || null);
    const categoryId =
      product.category && typeof product.category === "object"
        ? (product.category as any)._id
        : product.category;
    const supplierId =
      product.supplier && typeof product.supplier === "object"
        ? (product.supplier as any)._id
        : product.supplier;

    setFormData({
      ...product,
      category: categoryId || "",
      supplier: supplierId || "",
      nutrition: product.nutrition || [],
    });
    setShowForm(true);
  };

  const openAddForm = () => {
    setIsEditing(false);
    setFormData(INITIAL_PRODUCT);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(INITIAL_PRODUCT);
    setEditId(null);
  };

  // --- D. RENDER ---
  return (
    <div className="pb-20 font-sans text-slate-800 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Quản lý sản phẩm
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý kho hàng, giá cả và thông tin chi tiết.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <AdminSearch
            placeholder="Tìm tên, SKU..."
            onSearch={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onRefresh={fetchProducts}
          />
          <button
            onClick={openAddForm}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-700 font-bold shadow-lg shadow-green-200 transition active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus size={20} /> Thêm Mới
          </button>
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <ProductForm
          isEditing={isEditing}
          closeForm={closeForm}
          handleSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          suppliers={suppliers}
          handleFileUpload={handleFileUpload}
          handleAddUrl={handleAddUrl}
          tempImageUrl={tempImageUrl}
          setTempImageUrl={setTempImageUrl}
          addNutritionRow={addNutritionRow}
          updateNutritionRow={updateNutritionRow}
          removeNutritionRow={removeNutritionRow}
        />
      )}

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-gray-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 w-[80px] text-center">Ảnh</th>
                <th className="px-4 py-4 w-[25%] min-w-[200px]">
                  Tên sản phẩm
                </th>
                <th className="px-4 py-4 w-[12%]">SKU</th>
                <th className="px-4 py-4 w-[12%] text-right">Giá bán</th>
                <th className="px-4 py-4 w-[10%] text-center">Kho</th>
                <th className="px-4 py-4 w-[15%]">Danh mục</th>
                <th className="px-4 py-4 w-[30px] text-center">TT</th>
                <th className="px-4 py-4 w-[130px] text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin" /> Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-gray-400">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr
                    key={product._id}
                    className="hover:bg-blue-50/30 transition duration-200 group transform hover:scale-101 hover:bg-gray-200 animate-fade-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Cột 1: Ảnh */}
                    <td className="px-4 py-3 text-center align-middle">
                      <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden mx-auto">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            className="w-full h-full object-contain p-0.5"
                            alt={product.name}
                          />
                        ) : (
                          <ImageIcon className="text-gray-300" size={20} />
                        )}
                      </div>
                    </td>

                    {/* Cột 2: Tên & NCC */}
                    <td className="px-4 py-3 align-middle">
                      <div
                        className="font-semibold text-slate-800 line-clamp-2"
                        title={product.name}
                      >
                        {product.name}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        NCC:{" "}
                        {typeof product.supplier === "object"
                          ? (product.supplier as any)?.name
                          : "---"}
                      </div>
                    </td>

                    {/* Cột 3: SKU */}
                    <td className="px-4 py-3 align-middle">
                      <span className="font-mono text-xs text-slate-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {product.sku}
                      </span>
                    </td>

                    {/* Cột 4: Giá */}
                    <td className="px-4 py-3 text-right align-middle">
                      <span className="font-bold text-slate-800">
                        {product.price.toLocaleString()}đ
                      </span>
                      {product.originalPrice > product.price && (
                        <div className="text-[10px] text-gray-400 line-through">
                          {product.originalPrice.toLocaleString()}đ
                        </div>
                      )}
                    </td>

                    {/* Cột 5: Kho */}
                    <td className="px-4 py-3 text-center align-middle">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          product.stock > 10
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* Cột 6: Danh mục */}
                    <td className="px-4 py-3 align-middle">
                      <span className="text-xs font-medium text-slate-600 bg-gray-100 px-2 py-1 rounded-full">
                        {typeof product.category === "object"
                          ? (product.category as any).name
                          : "---"}
                      </span>
                    </td>

                    {/* Cột 7: Trạng thái (TT) */}
                    <td className="px-4 py-3 text-center align-middle">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mx-auto ${
                          product.isAvailable
                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                            : "bg-gray-300"
                        }`}
                        title={product.isAvailable ? "Đang bán" : "Ẩn"}
                      ></div>
                    </td>

                    {/* Cột 8: Hành động */}
                    <td className="px-4 py-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id!)}
                          className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="mt-6 flex justify-end">
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
