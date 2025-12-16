import React from "react";
import { CartProvider } from "@/contexts/CartContext";
import Header from "../components/shop/header";
import Footer from "../components/shop/footer";
import { WishlistProvider } from "@/contexts/WishlistContext";
import ChatWidget from "../components/chat_widget";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="login-wrapper">
      <CartProvider>
        <WishlistProvider>
          <div className="flex flex-col min-h-screen">
            {/* Nav dùng chung */}
            <Header />

            <main className="flex-grow bg-gray-50">{children}</main>

            {/* Footer dùng chung */}
            <Footer />
          </div>
        </WishlistProvider>
      </CartProvider>
      <ChatWidget />
    </div>
  );
}
