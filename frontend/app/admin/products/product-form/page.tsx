"use client";

import React, { useState } from "react";
// 1. Icons
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
  Save,
  Info,
  DollarSign,
  FileText,
  Layers,
  Edit,
  PlusCircle,
} from "lucide-react";

// --- TYPES & INTERFACES ---
interface ProductFormProps {
  isEditing: boolean;
  closeForm: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  categories: any[];
  suppliers: any[];
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "thumbnail" | "images"
  ) => void;
  handleAddUrl: () => void;
  tempImageUrl: string;
  setTempImageUrl: (url: string) => void;
  addNutritionRow: () => void;
  updateNutritionRow: (index: number, field: string, val: string) => void;
  removeNutritionRow: (index: number) => void;
}

// --- CONSTANTS & STYLES ---
// Style chung cho các ô input
const INPUT_CLASS =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-700 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all duration-200 bg-white";

// --- SUB-COMPONENTS ---
const Label = ({
  children,
  required,
  className = "",
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) => (
  <label
    className={`block text-sm font-bold text-slate-700 mb-1.5 ${className}`}
  >
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

// --- MAIN COMPONENT ---
export default function ProductForm({
  isEditing,
  closeForm,
  handleSubmit,
  formData,
  setFormData,
  categories,
  suppliers,
  handleFileUpload,
  handleAddUrl,
  tempImageUrl,
  setTempImageUrl,
  addNutritionRow,
  updateNutritionRow,
  removeNutritionRow,
}: ProductFormProps) {
  // 1. State quản lý Tab
  const [activeTab, setActiveTab] = useState("general");

  // 2. Cấu hình danh sách Tab
  const tabs = [
    { id: "general", label: "Thông tin chung", icon: Info },
    { id: "pricing", label: "Giá & Kho", icon: DollarSign },
    { id: "media", label: "Hình ảnh", icon: ImageIcon },
    { id: "details", label: "Chi tiết & SEO", icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* --- MODAL CONTAINER --- */}
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* A. HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              {isEditing ? (
                <Edit className="text-blue-500" size={20} />
              ) : (
                <PlusCircle className="text-green-500" size={20} />
              )}
              {isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {isEditing
                ? "Cập nhật thông tin chi tiết cho sản phẩm."
                : "Điền thông tin để tạo sản phẩm mới vào hệ thống."}
            </p>
          </div>
          <button
            onClick={closeForm}
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* B. BODY (Sidebar + Content) */}
        <div className="flex-1 flex overflow-hidden">
          {/* B1. SIDEBAR TABS (Desktop) */}
          <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 hidden md:flex flex-col gap-2 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left
                    ${
                      isActive
                        ? "bg-white text-green-700 shadow-sm border border-green-100 ring-1 ring-green-500/20"
                        : "text-gray-500 hover:bg-white hover:text-slate-700 hover:shadow-sm"
                    }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-green-600" : "text-gray-400"}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* B2. FORM CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white relative">
            <form
              id="product-form"
              onSubmit={handleSubmit}
              className="space-y-8 max-w-3xl mx-auto"
            >
              {/* --- TAB 1: THÔNG TIN CHUNG --- */}
              {activeTab === "general" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tên sản phẩm */}
                    <div className="md:col-span-2">
                      <Label required>Tên sản phẩm</Label>
                      <input
                        required
                        type="text"
                        className={INPUT_CLASS}
                        placeholder="VD: Táo Envy Mỹ Size Lớn"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        autoFocus
                      />
                    </div>

                    {/* SKU & Slug */}
                    <div>
                      <Label required>Mã SKU</Label>
                      <input
                        required
                        type="text"
                        className={`${INPUT_CLASS} font-mono text-sm`}
                        placeholder="VD: TAO-ENVY-01"
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Slug (URL)</Label>
                      <input
                        type="text"
                        className={`${INPUT_CLASS} bg-gray-50 text-gray-500`}
                        placeholder="Tự động tạo từ tên..."
                        value={formData.slug}
                        readOnly
                      />
                    </div>

                    {/* Danh mục */}
                    <div>
                      <Label required>Danh mục</Label>
                      <div className="relative">
                        <select
                          className={`${INPUT_CLASS} appearance-none cursor-pointer`}
                          value={formData.category as string}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                        >
                          <option value="">-- Chọn Danh mục --</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <Layers
                          className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                          size={16}
                        />
                      </div>
                    </div>

                    {/* Thương hiệu & Xuất xứ */}
                    <div>
                      <Label>Thương hiệu</Label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        placeholder="VD: Organic Farm"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Xuất xứ</Label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        placeholder="VD: Việt Nam"
                        value={formData.origin}
                        onChange={(e) =>
                          setFormData({ ...formData, origin: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Điều kiện bảo quản</Label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        placeholder="VD: Ngăn mát 5-10 độ C"
                        value={formData.preservation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preservation: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 2: GIÁ & KHO --- */}
              {activeTab === "pricing" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Pricing Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div>
                      <Label required>Giá bán (VNĐ)</Label>
                      <div className="relative">
                        <input
                          required
                          type="number"
                          min="0"
                          className={`${INPUT_CLASS} pl-9 font-bold text-green-700`}
                          placeholder="0"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price: Number(e.target.value),
                            })
                          }
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                          ₫
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label>Giá gốc (để gạch ngang)</Label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          className={`${INPUT_CLASS} pl-9 text-gray-500`}
                          placeholder="0"
                          value={formData.originalPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              originalPrice: Number(e.target.value),
                            })
                          }
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                          ₫
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stock & Supplier */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label required>Tồn kho</Label>
                      <input
                        required
                        type="number"
                        min="0"
                        className={INPUT_CLASS}
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label required>Đơn vị tính</Label>
                      <input
                        required
                        type="text"
                        className={INPUT_CLASS}
                        placeholder="kg, hộp, túi..."
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Nhà cung cấp</Label>
                      <select
                        className={INPUT_CLASS}
                        value={(formData.supplier as string) || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, supplier: e.target.value })
                        }
                      >
                        <option value="">-- Chọn NCC --</option>
                        {suppliers.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Nutrition Table */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="mb-0">Bảng giá trị dinh dưỡng</Label>
                      <button
                        type="button"
                        onClick={addNutritionRow}
                        className="px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition flex items-center gap-1"
                      >
                        <Plus size={14} /> Thêm dòng
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.nutrition?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-3 group">
                          <input
                            type="text"
                            placeholder="Tên (VD: Calo)"
                            className={`${INPUT_CLASS} py-2 text-sm flex-1`}
                            value={item.label}
                            onChange={(e) =>
                              updateNutritionRow(idx, "label", e.target.value)
                            }
                          />
                          <input
                            type="text"
                            placeholder="Giá trị (VD: 50kcal)"
                            className={`${INPUT_CLASS} py-2 text-sm flex-1`}
                            value={item.value}
                            onChange={(e) =>
                              updateNutritionRow(idx, "value", e.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeNutritionRow(idx)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      {(!formData.nutrition ||
                        formData.nutrition.length === 0) && (
                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                          Chưa có thông tin dinh dưỡng nào được thêm.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 3: HÌNH ẢNH --- */}
              {activeTab === "media" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Thumbnail Section */}
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-700">
                          Ảnh đại diện (Thumbnail)
                        </h4>
                        <p className="text-xs text-gray-500">
                          Ảnh này sẽ hiện ngoài danh sách sản phẩm.
                        </p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">
                        Bắt buộc
                      </span>
                    </div>

                    <div className="flex gap-6 items-start">
                      {/* Image Preview */}
                      <div className="w-32 h-32 shrink-0 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group hover:border-green-500 transition cursor-pointer">
                        {formData.thumbnail ? (
                          <img
                            src={formData.thumbnail}
                            className="w-full h-full object-cover"
                            alt="Thumbnail"
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://placehold.co/100x100?text=Error")
                            }
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <ImageIcon className="mx-auto mb-2 opacity-50" />
                            <span className="text-[10px] font-medium">
                              Upload
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                          <UploadCloud className="text-white" size={24} />
                        </div>
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={(e) => handleFileUpload(e, "thumbnail")}
                          accept="image/*"
                        />
                      </div>

                      {/* Image Input */}
                      <div className="flex-1 space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            className={`${INPUT_CLASS} pl-9 text-sm`}
                            placeholder="Hoặc dán URL ảnh vào đây..."
                            value={formData.thumbnail}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                thumbnail: e.target.value,
                              })
                            }
                          />
                          <ImageIcon
                            className="absolute left-3 top-2.5 text-gray-400"
                            size={16}
                          />
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Khuyến nghị: Ảnh vuông tỉ lệ 1:1, kích thước tối thiểu
                          500x500px.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Album Section */}
                  <div>
                    <Label>Album ảnh chi tiết</Label>
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          className={`${INPUT_CLASS} pl-9`}
                          placeholder="Dán link ảnh và nhấn Enter..."
                          value={tempImageUrl}
                          onChange={(e) => setTempImageUrl(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), handleAddUrl())
                          }
                        />
                        <ImageIcon
                          className="absolute left-3 top-2.5 text-gray-400"
                          size={16}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddUrl}
                        className="bg-gray-100 px-4 rounded-xl hover:bg-gray-200 text-gray-600 transition cursor-pointer"
                      >
                        <Plus size={20} />
                      </button>
                      <label className="bg-blue-50 text-blue-600 px-5 rounded-xl font-bold cursor-pointer hover:bg-blue-100 flex items-center gap-2 transition border border-blue-100">
                        <UploadCloud size={18} /> Upload
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "images")}
                          accept="image/*"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-200 min-h-[120px]">
                      {formData.images.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-8">
                          <ImageIcon size={32} className="mb-2 opacity-30" />
                          <span className="text-sm">
                            Chưa có ảnh nào trong album
                          </span>
                        </div>
                      )}
                      {formData.images.map((img: string, idx: number) => (
                        <div
                          key={idx}
                          className="group relative aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                        >
                          <img
                            src={img}
                            className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                            alt={`Gallery ${idx}`}
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://placehold.co/100x100?text=Err")
                            }
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-white/90 text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 shadow-sm"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                images: formData.images.filter(
                                  (_, i) => i !== idx
                                ),
                              })
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 4: CHI TIẾT & SEO --- */}
              {activeTab === "details" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Short Description */}
                  <div>
                    <Label>Mô tả ngắn (SEO Meta Description)</Label>
                    <textarea
                      rows={3}
                      className={`${INPUT_CLASS} resize-none`}
                      placeholder="Mô tả tóm tắt về sản phẩm..."
                      value={formData.shortDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shortDescription: e.target.value,
                        })
                      }
                    />
                    <p className="text-right text-xs text-gray-400 mt-1">
                      {formData.shortDescription?.length || 0}/160 ký tự
                    </p>
                  </div>

                  {/* Full Description */}
                  <div>
                    <Label>Mô tả chi tiết</Label>
                    <textarea
                      rows={8}
                      className={INPUT_CLASS}
                      placeholder="Viết chi tiết về sản phẩm, công dụng, hướng dẫn sử dụng..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Status Toggle */}
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-green-800">
                        Trạng thái kinh doanh
                      </h5>
                      <p className="text-xs text-green-600">
                        Bật để hiển thị sản phẩm này trên cửa hàng.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isAvailable}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isAvailable: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* C. Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 z-10">
          <button
            onClick={closeForm}
            className="px-6 py-2.5 text-gray-600 hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent hover:border-gray-200 rounded-xl transition font-medium"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 hover:shadow-green-300 flex items-center gap-2 active:scale-95 transition-all transform"
          >
            <Save size={18} />
            {isEditing ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </button>
        </div>
      </div>
    </div>
  );
}
