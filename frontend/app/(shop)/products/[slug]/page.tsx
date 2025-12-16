"use client";

// =========================================
// 1. IMPORTS
// =========================================
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Libraries & Icons
import { toast } from "sonner";
import {
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Truck,
  ShieldCheck,
  Leaf,
  Loader2,
  EyeOff,
  Eye,
  Camera,
  X,
  ShieldAlert,
  Reply,
} from "lucide-react";

// Services & Contexts
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { productService, Product } from "@/services/product.service";
import { reviewService } from "@/services/review.service";
import { uploadService, userService } from "@/services/user.service";

// =========================================
// 2. SUB-COMPONENTS
// =========================================

// Component: Tabs Navigation
const TabsNav = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
}) => (
  <div className="flex gap-8 border-b border-gray-200 mb-8 overflow-x-auto">
    {["description", "reviews", "policy"].map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`pb-4 text-sm font-bold uppercase tracking-wide transition-all relative whitespace-nowrap ${
          activeTab === tab
            ? "text-green-600"
            : "text-gray-500 hover:text-slate-800"
        }`}
      >
        {tab === "description"
          ? "Mô tả chi tiết"
          : tab === "reviews"
          ? "Đánh giá"
          : "Chính sách"}
        {activeTab === tab && (
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></span>
        )}
      </button>
    ))}
  </div>
);

// Component: Hiển thị sao đánh giá
const StarRating = ({
  rating,
  max = 5,
  size = 16,
}: {
  rating: number;
  max?: number;
  size?: number;
}) => (
  <div className="flex text-yellow-400 gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        size={size}
        fill={i + 1 <= rating ? "currentColor" : "none"}
        className={i + 1 > rating ? "text-gray-300" : ""}
      />
    ))}
  </div>
);

// =========================================
// 3. MAIN COMPONENT
// =========================================

export default function ProductDetailPage() {
  // --- A. HOOKS & PARAMS ---
  const params = useParams();
  const productSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // --- B. STATE MANAGEMENT ---

  // 1. Data State (Sản phẩm & User)
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 2. UI State (Giao diện)
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");

  // 3. User Review State (Form đánh giá)
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 4. Admin Action State (Trả lời/Ẩn)
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [adminReplyContent, setAdminReplyContent] = useState("");

  // --- C. EFFECTS (LOAD DATA) ---

  useEffect(() => {
    if (!productSlug) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Gọi song song API sản phẩm và user profile
        const [productData, userProfile] = await Promise.allSettled([
          productService.getById(productSlug),
          userService.getProfile().catch(() => null),
        ]);

        if (productData.status === "fulfilled") {
          const prod = productData.value;
          setProduct(prod);
          // Load reviews sau khi có ID sản phẩm
          const reviewsData = await reviewService.getByProduct(prod._id);
          setReviews(reviewsData);
        }

        if (userProfile.status === "fulfilled") {
          setCurrentUser(userProfile.value);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        toast.error("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productSlug]);

  // --- D. COMPUTED VALUES ---

  // Kiểm tra quyền Admin/Staff
  const isAdminOrStaff = currentUser && currentUser.roleId?.name !== "Customer";

  // Danh sách ảnh hiển thị
  const displayImages = product?.images?.length
    ? product.images
    : product?.thumbnail
    ? [product.thumbnail]
    : ["/placeholder.png"];

  // --- E. HANDLERS (XỬ LÝ SỰ KIỆN) ---

  // 1. Xử lý số lượng mua
  const handleQuantity = (type: "inc" | "dec") => {
    setQuantity((prev) =>
      type === "inc" ? prev + 1 : prev > 1 ? prev - 1 : 1
    );
  };

  // 2. Xử lý Upload ảnh Review
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadService.uploadImage(file)
      );
      const urls = await Promise.all(uploadPromises);
      setReviewImages((prev) => [...prev, ...urls]);
    } catch (error) {
      toast.error("Lỗi upload ảnh, vui lòng thử lại");
    } finally {
      setIsUploading(false);
    }
  };

  const removeReviewImage = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 3. Xử lý Submit/Edit Review (User)
  const handleSubmitReview = async () => {
    if (!currentUser) return toast.error("Vui lòng đăng nhập để đánh giá!");
    if (!userComment.trim())
      return toast.warning("Vui lòng nhập nội dung đánh giá!");
    if (!product) return;

    try {
      const payload = {
        productId: product._id,
        rating: userRating,
        comment: userComment,
        images: reviewImages,
      };

      if (editingReviewId) {
        await reviewService.update(editingReviewId, payload);
        toast.success("Đã cập nhật đánh giá!");
        handleCancelEdit();
      } else {
        await reviewService.create(payload);
        toast.success("Cảm ơn bạn đã đánh giá!");
        resetReviewForm();
      }

      // Reload reviews
      const newReviews = await reviewService.getByProduct(product._id);
      setReviews(newReviews);
    } catch (e) {
      toast.error("Đã có lỗi xảy ra khi gửi đánh giá");
    }
  };

  // Chuẩn bị form để sửa review
  const handleEditReview = (review: any) => {
    setEditingReviewId(review._id);
    setUserRating(review.rating);
    setUserComment(review.comment);
    setReviewImages(review.images || []);
    document
      .getElementById("review-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    resetReviewForm();
  };

  const resetReviewForm = () => {
    setUserRating(5);
    setUserComment("");
    setReviewImages([]);
  };

  // 4. Xử lý Admin Action (Reply / Hide)
  const handleSubmitReply = async (reviewId: string) => {
    if (!adminReplyContent.trim())
      return toast.warning("Chưa nhập nội dung trả lời!");

    try {
      await reviewService.reply(reviewId, adminReplyContent);
      toast.success("Đã gửi phản hồi!");
      setReplyingReviewId(null);
      setAdminReplyContent("");

      // Reload reviews
      if (product) {
        const newReviews = await reviewService.getByProduct(product._id);
        setReviews(newReviews);
      }
    } catch (e) {
      toast.error("Lỗi khi gửi phản hồi");
    }
  };

  const handleToggleHidden = async (review: any) => {
    try {
      await reviewService.toggleHidden(review._id);
      // Cập nhật state local ngay lập tức (Optimistic update)
      setReviews((prev) =>
        prev.map((r) =>
          r._id === review._id ? { ...r, isHidden: !r.isHidden } : r
        )
      );
      toast.success(review.isHidden ? "Đã hiện bình luận" : "Đã ẩn bình luận");
    } catch (e) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  // --- F. RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShieldAlert size={48} className="text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600">
          Sản phẩm không tồn tại
        </h2>
        <Link
          href="/products"
          className="text-green-600 hover:underline font-bold"
        >
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-20">
      {/* 1. BREADCRUMB */}
      <div className="bg-gray-50 py-4 border-b border-gray-100">
        <div className="container mx-auto px-4 text-sm text-gray-500">
          <Link href="/home" className="hover:text-green-600">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-green-600">
            Sản phẩm
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 font-medium truncate">
            {product.name}
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* 2. LEFT: PRODUCT GALLERY */}
          <div className="lg:w-1/2">
            <div className="relative h-[400px] lg:h-[500px] bg-gray-50 rounded-3xl flex items-center justify-center mb-6 overflow-hidden border border-gray-100 group">
              <img
                src={displayImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {/* Thumbnails */}
            {displayImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {displayImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`w-20 h-20 rounded-xl border-2 flex-shrink-0 overflow-hidden transition-all ${
                      activeImage === index
                        ? "border-green-600 opacity-100"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt="thumb"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. RIGHT: PRODUCT INFO */}
          <div className="lg:w-1/2">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-6 mb-6 text-sm">
              <StarRating rating={product.rating || 5} />
              <span className="text-gray-300">|</span>
              <span
                className={
                  product.stock > 0
                    ? "text-green-600 font-bold"
                    : "text-red-500 font-bold"
                }
              >
                {product.stock > 0 ? `Còn hàng (${product.stock})` : "Hết hàng"}
              </span>
            </div>

            <div className="flex items-end gap-4 mb-8">
              <span className="text-4xl font-bold text-green-600">
                {product.price.toLocaleString()}đ
              </span>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <span className="text-xl text-gray-400 line-through mb-1">
                    {product.originalPrice.toLocaleString()}đ
                  </span>
                )}
            </div>

            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              {product.shortDescription || "Mô tả đang cập nhật..."}
            </p>

            {/* Actions: Quantity, Add Cart, Wishlist */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <div className="flex items-center border-2 border-gray-200 rounded-full w-fit">
                <button
                  onClick={() => handleQuantity("dec")}
                  className="w-12 h-12 flex items-center justify-center hover:text-green-600 transition"
                >
                  <Minus size={20} />
                </button>
                <span className="w-12 text-center font-bold text-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantity("inc")}
                  className="w-12 h-12 flex items-center justify-center hover:text-green-600 transition"
                >
                  <Plus size={20} />
                </button>
              </div>

              <button
                onClick={() =>
                  addToCart(
                    { ...product, image: displayImages[0], quantity },
                    quantity
                  )
                }
                disabled={product.stock <= 0}
                className="flex-1 bg-slate-900 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={20} />
                {product.stock > 0 ? "Thêm vào giỏ ngay" : "Tạm hết hàng"}
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`w-14 h-14 border-2 rounded-full flex items-center justify-center transition-all ${
                  isInWishlist(product._id!)
                    ? "border-red-200 bg-red-50 text-red-500"
                    : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500"
                }`}
              >
                <Heart
                  size={24}
                  className={isInWishlist(product._id!) ? "fill-current" : ""}
                />
              </button>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-y-4 text-sm border-t border-gray-100 pt-6 text-slate-700">
              <div>
                <span className="font-bold text-slate-900">Thương hiệu:</span>{" "}
                {product.brand || "N/A"}
              </div>
              <div>
                <span className="font-bold text-slate-900">Xuất xứ:</span>{" "}
                {product.origin || "Việt Nam"}
              </div>
              <div>
                <span className="font-bold text-slate-900">Đơn vị:</span>{" "}
                {product.unit}
              </div>
              <div>
                <span className="font-bold text-slate-900">Bảo quản:</span>{" "}
                {product.preservation || "Nơi khô ráo"}
              </div>
            </div>
          </div>
        </div>

        {/* 4. TABS CONTENT SECTION */}
        <div className="mt-20">
          <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* TAB: DESCRIPTION */}
          {activeTab === "description" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
              <div className="lg:col-span-2 prose prose-green max-w-none text-gray-600 bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      product.description || "<p>Chưa có mô tả chi tiết</p>",
                  }}
                />
              </div>
              <div className="bg-green-50 rounded-2xl p-8 h-fit border border-green-100">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-green-800">
                  <Leaf className="w-5 h-5" /> Giá trị dinh dưỡng
                </h3>
                <ul className="space-y-4">
                  {product.nutrition?.map((nutri, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between border-b border-green-200 pb-2 border-dashed"
                    >
                      <span className="text-gray-600">{nutri.label}</span>
                      <span className="font-bold text-slate-800">
                        {nutri.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="max-w-4xl animate-fade-in">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                Đánh giá{" "}
                <span className="text-gray-400 text-lg font-normal">
                  ({reviews.length})
                </span>
              </h3>

              <div className="space-y-8">
                {reviews.length === 0 && (
                  <div className="text-gray-500 italic py-4">
                    Chưa có đánh giá nào cho sản phẩm này.
                  </div>
                )}

                {reviews
                  .filter((r) => !r.isHidden || isAdminOrStaff)
                  .map((review) => (
                    <div
                      key={review._id}
                      className={`border-b border-gray-100 pb-8 ${
                        review.isHidden
                          ? "opacity-60 bg-gray-50 p-4 rounded-xl border border-gray-200"
                          : ""
                      }`}
                    >
                      {/* Hidden Badge for Admin */}
                      {review.isHidden && (
                        <div className="flex items-center gap-1 text-red-500 text-xs font-bold mb-2">
                          <EyeOff size={12} /> ĐANG BỊ ẨN
                        </div>
                      )}

                      <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
                          {review.userId?.avatar ? (
                            <img
                              src={review.userId.avatar}
                              className="w-full h-full object-cover"
                              alt="avatar"
                            />
                          ) : (
                            <span className="text-gray-500">
                              {review.userId?.name?.[0] || "U"}
                            </span>
                          )}
                        </div>

                        <div className="flex-1">
                          {/* Header Review */}
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-slate-900">
                                {review.userId?.name || "Khách hàng ẩn danh"}
                              </h4>
                              <StarRating rating={review.rating} size={12} />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </span>

                              {/* Edit Button (User) */}
                              {currentUser &&
                                currentUser._id === review.userId?._id && (
                                  <button
                                    onClick={() => handleEditReview(review)}
                                    className="text-xs text-blue-600 hover:underline font-bold"
                                  >
                                    Sửa
                                  </button>
                                )}

                              {/* Toggle Hidden (Admin) */}
                              {isAdminOrStaff && (
                                <button
                                  onClick={() => handleToggleHidden(review)}
                                  className={`text-xs font-bold flex items-center gap-1 ${
                                    review.isHidden
                                      ? "text-green-600"
                                      : "text-red-500"
                                  }`}
                                >
                                  {review.isHidden ? (
                                    <>
                                      <Eye size={14} /> Hiện
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff size={14} /> Ẩn
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {review.comment}
                          </p>

                          {/* Review Images */}
                          {review.images?.length > 0 && (
                            <div className="flex gap-2 mb-4">
                              {review.images.map((img: string, i: number) => (
                                <div
                                  key={i}
                                  className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                                >
                                  <img
                                    src={img}
                                    className="w-full h-full object-cover hover:scale-110 transition cursor-zoom-in"
                                    alt="review-img"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Admin Reply Logic */}
                          {isAdminOrStaff &&
                            !review.replyComment &&
                            replyingReviewId !== review._id && (
                              <button
                                onClick={() => {
                                  setReplyingReviewId(review._id);
                                  setAdminReplyContent("");
                                }}
                                className="text-xs text-green-600 font-bold hover:underline mb-2 flex items-center gap-1"
                              >
                                <Reply /> Trả lời bình luận này
                              </button>
                            )}

                          {/* Reply Form */}
                          {replyingReviewId === review._id && (
                            <div className="mt-3 bg-white p-4 rounded-xl border border-green-200 shadow-sm animate-fade-in">
                              <h5 className="text-sm font-bold mb-2 text-slate-800">
                                Phản hồi khách hàng:
                              </h5>
                              <textarea
                                className="w-full border border-gray-300 p-3 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                rows={3}
                                autoFocus
                                placeholder="Nhập nội dung trả lời..."
                                value={adminReplyContent}
                                onChange={(e) =>
                                  setAdminReplyContent(e.target.value)
                                }
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setReplyingReviewId(null)}
                                  className="text-xs text-gray-500 hover:text-slate-800 px-3 py-2"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleSubmitReply(review._id)}
                                  className="bg-green-600 text-white px-4 py-2 text-xs font-bold rounded-lg hover:bg-green-700 transition"
                                >
                                  Gửi phản hồi
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Display Reply */}
                          {review.replyComment && (
                            <div className="mt-3 bg-gray-50 p-4 rounded-xl border-l-4 border-green-500">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-green-700 text-xs flex items-center gap-1">
                                  <ShieldCheck size={14} /> Phản hồi từ cửa hàng
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {review.repliedAt
                                    ? new Date(
                                        review.repliedAt
                                      ).toLocaleDateString("vi-VN")
                                    : ""}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {review.replyComment}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* REVIEW FORM */}
              <div
                id="review-form"
                className="mt-12 bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-xl text-slate-800">
                    {editingReviewId
                      ? "Chỉnh sửa đánh giá của bạn"
                      : "Viết đánh giá mới"}
                  </h4>
                  {editingReviewId && (
                    <button
                      onClick={handleCancelEdit}
                      className="text-sm text-red-500 hover:underline font-bold flex items-center gap-1"
                    >
                      <X size={16} /> Hủy bỏ
                    </button>
                  )}
                </div>

                {/* Rating Input */}
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      type="button"
                      className="transition transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={
                          star <= userRating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </div>

                {/* Comment Input */}
                <textarea
                  className="w-full border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4 h-32 bg-white resize-none"
                  placeholder="Sản phẩm thế nào? Hãy chia sẻ cảm nhận chân thực của bạn..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                ></textarea>

                {/* Image Upload */}
                <div className="mb-6">
                  <div className="flex gap-3 mb-2 flex-wrap">
                    {reviewImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-24 h-24 border rounded-xl overflow-hidden group shadow-sm"
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                          alt="upload-preview"
                        />
                        <button
                          onClick={() => removeReviewImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:text-green-500 transition text-gray-400 bg-white">
                      {isUploading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Camera size={24} />
                      )}
                      <span className="text-[10px] mt-2 font-bold">
                        {isUploading ? "Uploading..." : "Thêm ảnh"}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={isUploading}
                  className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-green-600 transition shadow-lg w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {editingReviewId ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                </button>
              </div>
            </div>
          )}

          {/* TAB: POLICY */}
          {activeTab === "policy" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="p-8 border border-gray-100 rounded-2xl hover:shadow-xl transition bg-gray-50">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                  <Truck size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Giao hàng siêu tốc</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Giao hàng trong 2h đối với nội thành. Miễn phí vận chuyển cho
                  đơn từ 500k.
                </p>
              </div>
              <div className="p-8 border border-gray-100 rounded-2xl hover:shadow-xl transition bg-gray-50">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                  <ShieldCheck size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Cam kết chất lượng</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Hoàn tiền 100% nếu sản phẩm không đạt chất lượng hoặc hư hỏng
                  trong quá trình vận chuyển.
                </p>
              </div>
              <div className="p-8 border border-gray-100 rounded-2xl hover:shadow-xl transition bg-gray-50">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                  <Leaf size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Nguồn gốc minh bạch</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Sản phẩm đạt chuẩn VietGAP, GlobalGAP. Truy xuất nguồn gốc rõ
                  ràng qua mã QR.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
