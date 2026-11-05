import "./globals.css";

export const metadata = {
  title: "업무 관리",
  description: "병원 외래간호 업무 관리 시트",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
