"use client";

// =========================================
// 1. IMPORTS
// =========================================
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Libraries
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";
import copy from "clipboard-copy";
import { toast } from "sonner";

// Icons
import {
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
  CheckCircle,
  Loader2,
  Tag,
  X,
  Copy,
  QrCode,
} from "lucide-react";

// Internal Services & Contexts
import { useCart } from "@/contexts/CartContext";
import { orderService } from "@/services/order.service";
import { couponService } from "@/services/coupon.service";
import { BANK_INFO } from "@/config/bank.config";
import CouponList from "@/app/components/shop/coupon_list";
import { userService } from "@/services/user.service";

// =========================================
// 2. TYPES & INTERFACES
// =========================================

interface Location {
  id: string;
  name: string;
}

interface Coupon {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderValue?: number;
}

interface CheckoutFormData {
  fullName: string;
  phone: string;
  cityName: string;
  districtName: string;
  wardName: string;
  street: string;
  note?: string;
}

// =========================================
// 3. SUB-COMPONENT: MODAL THANH TOÁN QR
// =========================================

const BankTransferModal = ({
  order,
  onClose,
  onSuccess,
}: {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const router = useRouter();

  if (!order) return null;

  // Cấu hình nội dung QR
  const amount = order.totalAmount;
  const content = `THANHTOAN ${order._id.slice(-6).toUpperCase()}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${
    BANK_INFO.ACCOUNT_NO
  }-${
    BANK_INFO.TEMPLATE
  }.png?amount=${amount}&addInfo=${content}&accountName=${encodeURIComponent(
    BANK_INFO.ACCOUNT_NAME
  )}`;

  // Polling: Kiểm tra trạng thái đơn hàng mỗi 3s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await orderService.getOrderById(order._id);
        if (res.status === "CONFIRMED" || res.status === "PAID") {
          toast.success("Thanh toán thành công!");
          clearInterval(interval);

          onSuccess();

          router.push(`/thank-you?orderId=${order._id}`);
        }
      } catch (e) {
        toast.error("Lỗi thanh toán!");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [order._id, router, , onSuccess]);

  // Copy nội dung chuyển khoản
  const handleCopy = () => {
    copy(content);
    toast.success("Đã sao chép nội dung chuyển khoản");
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-green-700 flex items-center justify-center gap-2">
            <QrCode /> Quét mã để thanh toán
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Hệ thống sẽ tự động duyệt sau khi nhận tiền.
          </p>
        </div>

        <div className="bg-gray-100 p-4 rounded-xl mb-6 flex justify-center">
          <img
            src={qrUrl}
            alt="QR Code"
            className="w-full h-auto rounded-lg mix-blend-multiply"
          />
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-600">Số tiền:</span>
            <span className="font-bold text-red-600 text-lg">
              {amount.toLocaleString()}đ
            </span>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600">Nội dung CK:</span>
              <button
                onClick={handleCopy}
                className="text-blue-600 text-xs font-bold hover:underline flex gap-1 items-center"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <div className="font-mono font-bold text-slate-800 text-center text-lg tracking-wider">
              {content}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium animate-pulse">
            <Loader2 className="animate-spin w-4 h-4" /> Đang chờ xác nhận thanh
            toán...
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================
// 4. MAIN COMPONENT: CHECKOUT PAGE
// =========================================

export default function CheckoutPage() {
  // --- A. STATE & HOOKS ---
  const router = useRouter();
  const { cart, totalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "banking">("cod");
  const [isSuccess, setIsSuccess] = useState(false);

  // Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  // Address Location State
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [wards, setWards] = useState<Location[]>([]);
  // const [selectedProvince, setSelectedProvince] = useState("");
  // const [selectedDistrict, setSelectedDistrict] = useState("");

  // Selected IDs
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");

  // Coupon State
  const FREE_SHIP_THRESHOLD = 500000;
  const BASE_SHIP_FEE = 30000;
  const shippingFee = totalPrice >= FREE_SHIP_THRESHOLD ? 0 : BASE_SHIP_FEE;

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);
  const [totalDiscount, setTotalDiscount] = useState(0);

  // Form Hook
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>();

  // --- B. EFFECTS (DATA & LOGIC) ---

  // 1. Load danh sách Tỉnh/Thành phố khi mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await axios.get("https://esgoo.net/api-tinhthanh/1/0.htm");
        if (res.data.error === 0) setProvinces(res.data.data);
      } catch (error) {
        console.error("Lỗi lấy tỉnh thành:", error);
      }
    };
    fetchProvinces();
  }, []);

  // 2. Load user profile to fill form
  // --- LOGIC: AUTO-FILL ADDRESS FROM USER PROFILE ---
  // Hàm này phức tạp vì phải load tuần tự: Tỉnh -> Huyện -> Xã
  const loadAddressFromProfile = async (addressStr: string) => {
    try {
      // 1. Parse chuỗi địa chỉ: "Số nhà, Xã A, Huyện B, Tỉnh C"
      const parts = addressStr.split(",").map((p) => p.trim());

      // Nếu không đủ 4 phần, chỉ điền số nhà
      if (parts.length < 4) {
        setValue("street", addressStr);
        return;
      }

      const street = parts.slice(0, parts.length - 3).join(" ");
      const wardName = parts[parts.length - 3]; // Xã
      const districtName = parts[parts.length - 2]; // Huyện
      const cityName = parts[parts.length - 1]; // Tỉnh

      setValue("street", street);

      // 2. Tìm ID Tỉnh
      // Gọi API lấy danh sách tỉnh (nếu chưa có) hoặc dùng state provinces hiện tại
      const resP = await axios.get("https://esgoo.net/api-tinhthanh/1/0.htm");
      const listProvinces = resP.data.data || [];
      setProvinces(listProvinces);

      const foundCity = listProvinces.find(
        (p: any) => p.name === cityName || p.name.includes(cityName)
      );
      if (!foundCity) return; // Không tìm thấy tỉnh, dừng

      setSelectedProvinceId(foundCity.id);
      setValue("cityName", foundCity.name);

      // 3. Load Huyện theo ID Tỉnh vừa tìm
      const resD = await axios.get(
        `https://esgoo.net/api-tinhthanh/2/${foundCity.id}.htm`
      );
      const listDistricts = resD.data.data || [];
      setDistricts(listDistricts);

      const foundDistrict = listDistricts.find(
        (d: any) => d.name === districtName || d.name.includes(districtName)
      );
      if (!foundDistrict) return;

      setSelectedDistrictId(foundDistrict.id);
      setValue("districtName", foundDistrict.name);

      // 4. Load Xã theo ID Huyện vừa tìm
      const resW = await axios.get(
        `https://esgoo.net/api-tinhthanh/3/${foundDistrict.id}.htm`
      );
      const listWards = resW.data.data || [];
      setWards(listWards);

      const foundWard = listWards.find(
        (w: any) => w.name === wardName || w.name.includes(wardName)
      );
      if (foundWard) {
        setSelectedWardId(foundWard.id);
        setValue("wardName", foundWard.name);
      }
    } catch (e) {
      console.error("Lỗi auto-fill address:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Load User Profile
      try {
        const user = await userService.getProfile();
        if (user) {
          setValue("fullName", user.name);
          setValue("phone", user.phone || "");

          const defaultAddr =
            user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
          if (defaultAddr && defaultAddr.address) {
            // Gọi hàm auto-fill
            await loadAddressFromProfile(defaultAddr.address);
          } else {
            // Nếu không có địa chỉ, load tỉnh mặc định
            const res = await axios.get(
              "https://esgoo.net/api-tinhthanh/1/0.htm"
            );
            if (res.data.error === 0) setProvinces(res.data.data);
          }
        } else {
          // Guest: chỉ load tỉnh
          const res = await axios.get(
            "https://esgoo.net/api-tinhthanh/1/0.htm"
          );
          if (res.data.error === 0) setProvinces(res.data.data);
        }
      } catch (error) {
        // Lỗi (chưa login): Load tỉnh bình thường
        const res = await axios.get("https://esgoo.net/api-tinhthanh/1/0.htm");
        if (res.data.error === 0) setProvinces(res.data.data);
      }
    };
    init();
  }, [setValue]);

  // 3. Redirect nếu giỏ hàng trống
  useEffect(() => {
    // Nếu giỏ hàng trống vì thanh toán thành công thì không chuyển sang page products
    if (cart.length === 0 && !showPaymentModal && !isSuccess && !currentOrder) {
      router.push("/products");
    }
  }, [cart, router, showPaymentModal, isSuccess]);

  // 4. Tính toán tổng tiền giảm giá (Discount)
  useEffect(() => {
    let discountAmount = 0;

    // Lọc các mã hợp lệ (đủ minOrderValue)
    const validCoupons = appliedCoupons.filter((c) => {
      const minOrder = c.minOrderValue || 0;
      return totalPrice >= minOrder;
    });

    validCoupons.forEach((c) => {
      if (c.type === "PERCENT") {
        discountAmount += (totalPrice * Number(c.value)) / 100;
      } else {
        discountAmount += Number(c.value);
      }
    });

    // Đảm bảo giảm giá không vượt quá (Tổng tiền + Ship)
    const maxDiscount = totalPrice + shippingFee;
    setTotalDiscount(Math.min(discountAmount, maxDiscount));
  }, [appliedCoupons, totalPrice, shippingFee]);

  // --- C. HANDLERS: ADDRESS ---

  const handleProvinceChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const provinceId = e.target.value;

    setSelectedProvinceId(provinceId);

    // Reset District & Ward
    setDistricts([]);
    setWards([]);
    setSelectedDistrictId("");
    setSelectedWardId("");

    // Reset value trong form
    setValue("districtName", "");
    setValue("wardName", "");

    // Set Name cho form
    const provinceName = provinces.find((p) => p.id === provinceId)?.name || "";

    setValue("cityName", provinceName, { shouldValidate: true });

    // Load Districts
    if (provinceId) {
      try {
        const res = await axios.get(
          `https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`
        );
        if (res.data.error === 0) setDistricts(res.data.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDistrictChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const districtId = e.target.value;

    setSelectedDistrictId(districtId);

    // Reset Ward
    setWards([]);
    setSelectedWardId("");
    setValue("wardName", "");

    // Set Name cho form
    const districtName = districts.find((d) => d.id === districtId)?.name || "";
    setValue("districtName", districtName, { shouldValidate: true });

    // Load Wards
    if (districtId) {
      try {
        const res = await axios.get(
          `https://esgoo.net/api-tinhthanh/3/${districtId}.htm`
        );
        if (res.data.error === 0) setWards(res.data.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value;

    setSelectedWardId(wardId);

    const wardName = wards.find((w) => w.id === wardId)?.name || "";
    setValue("wardName", wardName, { shouldValidate: true });
  };

  // --- D. HANDLERS: COUPON ---

  const handleAddCoupon = async () => {
    if (!couponInput.trim()) return;
    const code = couponInput.trim().toUpperCase();

    // Check trùng mã
    if (appliedCoupons.find((c) => c.code === code)) {
      return toast.warning("Mã này đã được áp dụng rồi!");
    }

    try {
      const coupon = await couponService.validateCode(code);
      const minOrder = coupon.minOrderValue || 0;

      // Check điều kiện Min Order
      if (totalPrice < minOrder) {
        toast.warning(
          `Đơn hàng cần tối thiểu ${minOrder.toLocaleString()}đ để dùng mã này.`
        );
        return;
      }

      setAppliedCoupons((prev) => [...prev, coupon]);
      setCouponInput("");
      toast.success("Áp dụng mã thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Mã không hợp lệ");
    }
  };

  const handleRemoveCoupon = (code: string) => {
    setAppliedCoupons((prev) => prev.filter((c) => c.code !== code));
  };

  // --- E. HANDLERS: SUBMIT ORDER ---

  const onPlaceOrder: SubmitHandler<CheckoutFormData> = async (data) => {
    setIsProcessing(true);
    // setIsSuccess(true); // Đánh dấu là đã thành công để chặn useEffect redirect về products
    try {
      // Tính toán tổng tiền cuối cùng
      const finalTotal = totalPrice + shippingFee - totalDiscount;

      // Validate địa chỉ lần cuối (vì select option có thể chưa chọn)
      if (!data.cityName || !data.districtName || !data.wardName) {
        toast.error("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã");
        setIsProcessing(false);
        return;
      }

      // Lọc lại coupon hợp lệ tại thời điểm submit
      const validCouponCodes = appliedCoupons
        .filter((c) => totalPrice >= (c.minOrderValue || 0))
        .map((c) => c.code);

      const method =
        finalTotal <= 0
          ? "COD"
          : paymentMethod === "banking"
          ? "BANK_TRANSFER"
          : "COD";

      const orderPayload = {
        customerInfo: {
          name: data.fullName,
          phone: data.phone,
          note: data.note,
          address: {
            street: data.street,
            ward: data.wardName,
            district: data.districtName,
            city: data.cityName,
          },
        },
        items: cart.map((item) => ({
          productId: item.id,
          quantity: Number(item.quantity),
        })),
        paymentMethod: method,
        couponCodes: validCouponCodes,
      };

      // Gọi API tạo đơn
      const res = await orderService.createOrder(orderPayload);

      if (finalTotal <= 0) {
        // TRƯỜNG HỢP: 0 ĐỒNG -> THÀNH CÔNG LUÔN
        clearCart();
        toast.success("Đơn hàng 0đ đã được xác nhận!");
        setIsSuccess(true);
        router.push(`/thank-you?orderId=${res._id}`);
      } else if (paymentMethod === "banking") {
        setCurrentOrder(res);
        setShowPaymentModal(true);
        // clearCart();
      } else {
        clearCart();
        toast.success("Đặt hàng thành công!");
        router.push(`/thank-you?orderId=${res._id}`);
      }
    } catch (error: any) {
      console.error("Lỗi đặt hàng:", error);
      toast.error(
        error.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    // router.push("/order-history");
    toast.info(
      "Bạn đã hủy thanh toán QR. Vui lòng thử lại hoặc chọn phương thức khác."
    );
  };

  // Tránh render khi chưa có dữ liệu giỏ hàng
  if (cart.length === 0 && !showPaymentModal) return null;

  // --- F. RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 py-10 font-sans text-slate-800">
      {/* 1. Modal Thanh Toán QR */}
      {showPaymentModal && currentOrder && (
        <BankTransferModal
          order={currentOrder}
          onClose={handleCloseModal}
          onSuccess={() => {
            clearCart();
            setIsSuccess(true);
          }}
        />
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">Thanh toán</h1>

        <form
          onSubmit={handleSubmit(onPlaceOrder)}
          className="flex flex-col lg:flex-row gap-8"
        >
          {/* === CỘT TRÁI: THÔNG TIN & THANH TOÁN === */}
          <div className="lg:w-2/3 space-y-6 animate-fade-up">
            {/* Box 1: Địa chỉ giao hàng */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="text-green-600" /> Thông tin giao hàng
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input Họ tên */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                    <input
                      {...register("fullName", {
                        required: "Vui lòng nhập họ tên",
                      })}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  {errors.fullName && (
                    <span className="text-xs text-red-500">
                      {errors.fullName.message}
                    </span>
                  )}
                </div>

                {/* Input SĐT */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                    <input
                      {...register("phone", {
                        required: "Vui lòng nhập SĐT",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "SĐT không hợp lệ",
                        },
                      })}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="0912..."
                    />
                  </div>
                  {errors.phone && (
                    <span className="text-xs text-red-500">
                      {errors.phone.message}
                    </span>
                  )}
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tỉnh / Thành phố <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    onChange={handleProvinceChange}
                    value={selectedProvinceId}
                  >
                    <option value="">-- Chọn Tỉnh/Thành --</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="hidden"
                    {...register("cityName", { required: true })}
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quận / Huyện <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg bg-white disabled:bg-gray-100"
                    onChange={handleDistrictChange}
                    disabled={!selectedProvinceId}
                    value={selectedDistrictId}
                  >
                    <option value="">-- Chọn Quận/Huyện --</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="hidden"
                    {...register("districtName", { required: true })}
                  />
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phường / Xã <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg bg-white disabled:bg-gray-100"
                    onChange={handleWardChange}
                    disabled={!selectedDistrictId}
                    value={selectedWardId}
                  >
                    <option value="">-- Chọn Phường/Xã --</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="hidden"
                    {...register("wardName", { required: true })}
                  />
                </div>

                {/* Street */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số nhà, Tên đường <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("street", {
                      required: "Vui lòng nhập số nhà/đường",
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="VD: 123 Đường Nguyễn Huệ"
                  />
                  {errors.street && (
                    <span className="text-xs text-red-500">
                      {errors.street.message}
                    </span>
                  )}
                </div>

                {/* Input Ghi chú */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Ghi chú (Tùy chọn)
                  </label>
                  <textarea
                    {...register("note")}
                    rows={2}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Giao giờ hành chính, gọi trước khi giao..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Box 2: Phương thức thanh toán */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-up">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="text-green-600" /> Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {/* Option COD */}
                <label
                  className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition transform hover:scale-[1.01] ${
                    paymentMethod === "cod"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="w-5 h-5 accent-green-600"
                  />
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                      <Truck size={18} /> Thanh toán khi nhận hàng (COD)
                    </div>
                    <div className="text-sm text-gray-500">
                      Bạn chỉ phải thanh toán khi đã nhận được hàng.
                    </div>
                  </div>
                </label>

                {/* Option Banking */}
                <label
                  className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition transform hover:scale-[1.01] ${
                    paymentMethod === "banking"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="banking"
                    checked={paymentMethod === "banking"}
                    onChange={() => setPaymentMethod("banking")}
                    className="w-5 h-5 accent-green-600"
                  />
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                      <CreditCard size={18} /> Chuyển khoản ngân hàng (QR Code)
                    </div>
                    <div className="text-sm text-gray-500">
                      Quét mã QR để thanh toán nhanh chóng và an toàn.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* === CỘT PHẢI: TÓM TẮT ĐƠN HÀNG === */}
          <div className="lg:w-1/3 animate-fade-up">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-lg font-bold border-b border-gray-100 pb-4 mb-4">
                Đơn hàng ({cart.length} món)
              </h3>

              {/* List Sản phẩm */}
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-4 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center text-xl shrink-0 overflow-hidden border border-gray-200">
                      {item.image ? (
                        <img
                          src={item.image}
                          className="w-full h-full object-contain p-1"
                          alt={item.name}
                        />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm line-clamp-1">
                        {item.name}
                      </h4>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>SL: {item.quantity}</span>
                        <span>
                          {(item.price * item.quantity).toLocaleString()}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chi phí */}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="font-bold">
                    {totalPrice.toLocaleString()}đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span
                    className={
                      shippingFee === 0
                        ? "text-green-600 font-bold"
                        : "font-medium"
                    }
                  >
                    {shippingFee === 0
                      ? "Miễn phí"
                      : `${shippingFee.toLocaleString()}đ`}
                  </span>
                </div>
                {shippingFee > 0 && (
                  <div className="text-xs text-orange-500 italic mt-1">
                    Mua thêm{" "}
                    {(FREE_SHIP_THRESHOLD - totalPrice).toLocaleString()}đ để
                    được Freeship!
                  </div>
                )}

                {/* Section Coupon */}
                <div className="mb-4 mt-4">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá"
                      className="border rounded-lg px-3 py-2 w-full uppercase"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddCoupon())
                      }
                    />
                    <button
                      type="button"
                      onClick={handleAddCoupon}
                      className="bg-slate-800 text-white px-4 rounded-lg font-bold whitespace-nowrap hover:bg-slate-700 transition"
                    >
                      Áp dụng
                    </button>
                  </div>

                  {/* List Mã đã áp dụng */}
                  {appliedCoupons.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {appliedCoupons.map((coupon) => {
                        const isValid =
                          totalPrice >= (coupon.minOrderValue || 0);
                        return (
                          <div
                            key={coupon.code}
                            className={`flex items-center justify-between px-2 py-1 rounded-md text-xs font-bold border ${
                              isValid
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <Tag size={12} /> {coupon.code}
                              {!isValid && (
                                <span className="text-[10px] font-normal italic ml-1">
                                  (Chưa đủ điều kiện)
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCoupon(coupon.code)}
                              className="hover:text-red-500 ml-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tổng thanh toán */}
                <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>Giảm giá</span>
                      <span>-{totalDiscount.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-gray-50 mt-2">
                    <span>Tổng cộng</span>
                    <span>
                      {(
                        totalPrice +
                        shippingFee -
                        totalDiscount
                      ).toLocaleString()}
                      đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút Đặt hàng */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-6 bg-slate-900 hover:bg-green-600 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CheckCircle />
                )}
                {isProcessing ? "Đang xử lý..." : "Đặt Hàng Ngay"}
              </button>

              <p className="text-xs text-center text-gray-400 mt-4">
                Bằng cách đặt hàng, bạn đồng ý với điều khoản sử dụng của
                FreshFood.
              </p>
            </div>
          </div>
        </form>

        {/* Danh sách Coupon */}
        <CouponList />
      </div>
    </div>
  );
}
