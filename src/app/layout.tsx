import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POS SAAS — Quản lý Bán Hàng",
  description: "Hệ thống quản lý bán hàng đa chi nhánh — POS, kho hàng, khách hàng, báo cáo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
