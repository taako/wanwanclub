import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dog Run Connect",
  description: "会員制ドッグランのリアルタイム利用履歴・ステータス管理サービス",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
