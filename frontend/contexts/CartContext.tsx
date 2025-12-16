"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { toast } from "sonner";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES) ---

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, type: "inc" | "dec") => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
};

// --- 2. KHỞI TẠO CONTEXT ---
const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "freshfood_cart";

// --- 3. PROVIDER COMPONENT ---
export function CartProvider({ children }: { children: React.ReactNode }) {
  // State giỏ hàng
  const [cart, setCart] = useState<CartItem[]>([]);

  // Flag kiểm tra xem đã load xong dữ liệu từ LocalStorage (Tránh ghi đè khi chưa load)
  const [isInitialized, setIsInitialized] = useState(false);

  // --- A. EFFECTS: QUẢN LÝ LOCAL STORAGE ---

  // 1. Load Cart (Chỉ chạy 1 lần khi mount)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Lỗi parsing giỏ hàng:", e);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // 2. Save Cart (Chỉ lưu khi cart thay đổi VÀ đã khởi tạo xong)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  // --- B. HANDLERS: CÁC HÀM XỬ LÝ ---

  // Thêm sản phẩm vào giỏ
  const addToCart = (product: any, qty = 1) => {
    const categoryName =
      product.category && typeof product.category === "object"
        ? product.category.name
        : "Sản phẩm";

    const itemToAdd: CartItem = {
      id: product.id || product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || product.thumbnail || "", // Lấy ảnh đại diện sản phẩm
      quantity: qty,
      category: categoryName,
    };

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === itemToAdd.id);

      // Nếu đã có -> Cộng dồn số lượng
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === itemToAdd.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      // Nếu chưa có -> Thêm mới
      return [...prevCart, itemToAdd];
    });

    toast.success("Đã thêm vào giỏ hàng!");
  };

  // Xóa sản phẩm khỏi giỏ
  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Cập nhật số lượng (+/-)
  const updateQuantity = (id: string, type: "inc" | "dec") => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id) {
          const newQuantity =
            type === "inc" ? item.quantity + 1 : item.quantity - 1;
          // Giữ số lượng tối thiểu là 1
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      })
    );
  };

  // Xóa sạch giỏ hàng
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // --- C. CALCULATIONS: TÍNH TOÁN ---

  // Dùng useMemo tránh tính toán lại không cần thiết khi component re-render
  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // --- D. RENDER ---
  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// --- 4. CUSTOM HOOK ---
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
