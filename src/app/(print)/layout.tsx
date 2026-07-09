import React from "react";
import { Tajawal } from "next/font/google";
import "../globals.css";

export const metadata = {
  title: "Print - KitchenNest",
  robots: "noindex, nofollow",
};

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white text-black min-h-screen w-full print:bg-white">
      {children}
    </div>
  );
}
