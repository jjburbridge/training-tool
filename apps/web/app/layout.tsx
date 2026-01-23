import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "./components/Sidebar";
import { BluetoothProvider } from "./contexts/BluetoothContext";
import { FTPProvider } from "./contexts/FTPContext";
import { PowerDisplayWrapper } from "./components/PowerDisplayWrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Training Tool",
  description:
    "Cycling training tool with workout plans and power meter integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <FTPProvider>
          <BluetoothProvider>
            <div
              style={{
                display: "flex",
                minHeight: "100vh",
              }}
            >
              <Sidebar />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <main style={{ flex: 1 }}>{children}</main>
              </div>
            </div>
          </BluetoothProvider>
        </FTPProvider>
      </body>
    </html>
  );
}
