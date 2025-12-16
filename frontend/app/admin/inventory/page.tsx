"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/product.service";
import { inventoryService } from "@/services/inventory.service";
import { Supplier, supplierService } from "@/services/supplier.service";
import {
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  X,
  History,
  Box,
  Loader2,
} from "lucide-react";
import AdminSearch from "@/app/components/admin/search";
import InventoryHistoryTab from "./history/page";
import { toast } from "sonner";
import Pagination from "@/app/components/pagination";

// --- FORM ---
interface InventoryFormState {
  quantity: number;
  reason: string;
  supplier: string; // ID supplier
  code: string; // Reference Code
}

export default function AdminInventoryPage() {
  // --- STATE DATA ---
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE UI ---
  const [activeTab, setActiveTab] = useState<"stock" | "history">("stock");
  const [modalType, setModalType] = useState<"IMPORT" | "DAMAGED" | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // --- STATE PAGINATION & SEARCH ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE FORM ---
  const [formData, setFormData] = useState<InventoryFormState>({
    quantity: 1,
    reason: "",
    supplier: "",
    code: "",
  });

  // --- API: LOAD DATA ---
  const loadData = async () => {
    setLoading(true);
    try {
      // Load song song Product và Supplier
      const [pRes, sRes] = await Promise.all([
        productService.getAll({ page, limit: 10, keyword: searchQuery }),
        supplierService.getAll(1, 100, ""),
      ]);

      if (pRes && Array.isArray(pRes.data)) {
        setProducts(pRes.data);
        setTotalPages(pRes.lastPage);
      }

      if (sRes && Array.isArray(sRes.data)) {
        setSuppliers(sRes.data);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu kho:", error);
      toast.error("Không thể tải dữ liệu kho");
    } finally {
      setLoading(false);
    }
  };

  // Reload khi page/search thay đổi
  useEffect(() => {
    loadData();
  }, [page, searchQuery]);

  // --- HANDLER: OPEN MODAL ---
  const handleOpenModal = (product: Product, type: "IMPORT" | "DAMAGED") => {
    setSelectedProduct(product);
    setModalType(type);

    // Reset form
    setFormData({
      quantity: 1,
      reason: "",
      supplier: "",
      code: "",
    });
  };

  // --- HANDLER: SUBMIT FORM ---
  const handleSubmit = async () => {
    if (!selectedProduct) return;

    // 1. Validate cơ bản
    if (formData.quantity <= 0) return toast.warning("Số lượng phải lớn hơn 0");
    if (modalType === "DAMAGED" && formData.quantity > selectedProduct.stock) {
      return toast.error("Không thể hủy nhiều hơn số tồn kho!");
    }

    // 2. Map dữ liệu sang DTO của Backend
    const payload = {
      productId: selectedProduct._id,
      quantity: Number(formData.quantity),
      reason: formData.reason,
      supplierId: formData.supplier || undefined,
      referenceCode: formData.code || undefined,
    };

    try {
      // 3. Gọi API tương ứng
      if (modalType === "IMPORT") {
        await inventoryService.importGoods(payload);
        toast.success(`Đã nhập kho thành công +${payload.quantity} SP`);
      } else {
        await inventoryService.discardGoods(payload);
        toast.success(`Đã xuất hủy thành công -${payload.quantity} SP`);
      }

      setModalType(null);
      loadData(); // Reload để cập nhật số tồn
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Có lỗi xảy ra";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="text-slate-800 pb-20 animate-fade-in font-sans">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Quản lý Kho vận</h2>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi tồn kho, nhập hàng và xử lý hàng hỏng.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-gray-100 p-1.5 rounded-xl flex text-sm font-bold shadow-inner">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "stock"
                ? "bg-white shadow text-blue-600"
                : "text-gray-500 hover:text-slate-700 hover:bg-gray-200"
            }`}
          >
            <Box size={18} /> Tồn kho hiện tại
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "history"
                ? "bg-white shadow text-blue-600"
                : "text-gray-500 hover:text-slate-700 hover:bg-gray-200"
            }`}
          >
            <History size={18} /> Lịch sử xuất nhập
          </button>
        </div>
      </div>

      {/* --- TAB 1: STOCK LIST --- */}
      {activeTab === "stock" && (
        <div className="animate-slide-up">
          {/* Toolbar */}
          <div className="mb-6 flex justify-between items-center">
            <div className="w-full max-w-md">
              <AdminSearch
                placeholder="Tìm tên sản phẩm, mã SKU..."
                onSearch={(q) => {
                  setSearchQuery(q);
                  setPage(1);
                }}
                onRefresh={loadData}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-5 w-1/3">Sản phẩm</th>
                  <th className="p-5 w-1/6">Mã SKU</th>
                  <th className="p-5 text-center w-1/6">Tồn kho</th>
                  <th className="p-5 text-center w-1/6">Trạng thái</th>
                  <th className="p-5 text-right w-1/6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin" /> Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-12 text-center text-gray-400 italic"
                    >
                      Không tìm thấy sản phẩm nào khớp với từ khóa.
                    </td>
                  </tr>
                ) : (
                  products.map((p, index) => {
                    const isLowStock = p.stock > 0 && p.stock < 10;
                    const isOutOfStock = p.stock <= 0;

                    return (
                      <tr
                        key={p._id}
                        className="hover:bg-blue-50/30 transition-colors duration-300 group transform hover:scale-101 hover:bg-gray-200 animate-fade-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                              <img
                                src={p.thumbnail || "/placeholder.png"}
                                className="w-full h-full object-contain"
                                alt={p.name}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-base">
                                {p.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                                {p.category?.name || "Chưa phân loại"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 font-mono text-slate-600 font-medium">
                          {p.sku || "---"}
                        </td>
                        <td className="p-5 text-center">
                          <span
                            className={`font-bold text-lg ${
                              isLowStock || isOutOfStock
                                ? "text-red-600"
                                : "text-slate-800"
                            }`}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                              Hết hàng
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">
                              Sắp hết
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                              Sẵn hàng
                            </span>
                          )}
                        </td>

                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal(p, "IMPORT")}
                              className="flex items-center gap-1.5 bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-50 transition shadow-sm cursor-pointer"
                              title="Nhập thêm hàng"
                            >
                              <PackagePlus size={16} /> Nhập
                            </button>

                            <button
                              disabled={p.stock <= 0}
                              onClick={() => handleOpenModal(p, "DAMAGED")}
                              className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              title="Báo hỏng / Xuất hủy"
                            >
                              <PackageMinus size={16} /> Hủy
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* --- TAB 2: HISTORY --- */}
      {activeTab === "history" && (
        <div className="animate-slide-up">
          <InventoryHistoryTab />
        </div>
      )}

      {/* --- MODAL IMPORT / EXPORT --- */}
      {modalType && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div
              className={`px-6 py-4 border-b flex justify-between items-center ${
                modalType === "IMPORT"
                  ? "bg-green-50 border-green-100"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <h3
                className={`text-lg font-bold flex items-center gap-2 ${
                  modalType === "IMPORT" ? "text-green-800" : "text-red-800"
                }`}
              >
                {modalType === "IMPORT" ? <PackagePlus /> : <AlertTriangle />}
                {modalType === "IMPORT"
                  ? "Nhập kho sản phẩm"
                  : "Báo lỗi / Hủy hàng"}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className={`p-1 rounded-full hover:bg-white/50 transition ${
                  modalType === "IMPORT" ? "text-green-800" : "text-red-800"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Info Card */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 items-center">
                <div className="w-14 h-14 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0 p-1">
                  <img
                    src={selectedProduct.thumbnail || "/placeholder.png"}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base line-clamp-1">
                    {selectedProduct.name}
                  </h4>
                  <div className="flex gap-3 text-xs text-gray-500 mt-1">
                    <span className="bg-white px-1.5 py-0.5 rounded border">
                      SKU: <b>{selectedProduct.sku}</b>
                    </span>
                    <span className="bg-white px-1.5 py-0.5 rounded border">
                      Tồn kho: <b>{selectedProduct.stock}</b>
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div className="grid grid-cols-2 gap-5">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">
                    Số lượng {modalType === "IMPORT" ? "nhập" : "hủy"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg text-slate-800"
                    min="1"
                    max={
                      modalType === "DAMAGED"
                        ? selectedProduct.stock
                        : undefined
                    }
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Reference Code */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">
                    Mã phiếu (Ref)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder:text-gray-400"
                    placeholder={
                      modalType === "IMPORT" ? "VD: PN-001" : "VD: HUY-002"
                    }
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Supplier Select */}
              {modalType === "IMPORT" && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">
                    Nhà cung cấp
                  </label>
                  <select
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm cursor-pointer"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                  >
                    {selectedProduct.supplier ? (
                      <option
                        key={selectedProduct.supplier._id}
                        value={selectedProduct.supplier._id}
                      >
                        {selectedProduct.supplier.name}
                      </option>
                    ) : (
                      <option value="">-- Chọn Nhà cung cấp --</option>
                    )}
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">
                  Ghi chú / Lý do
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                  placeholder={
                    modalType === "IMPORT"
                      ? "Nhập hàng đợt 1..."
                      : "Hỏng do vận chuyển..."
                  }
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setModalType(null)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-lg transition transform active:scale-95 flex items-center gap-2 ${
                  modalType === "IMPORT"
                    ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                    : "bg-red-600 hover:bg-red-700 shadow-red-200"
                }`}
              >
                {modalType === "IMPORT" ? "Xác nhận Nhập" : "Xác nhận Hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
