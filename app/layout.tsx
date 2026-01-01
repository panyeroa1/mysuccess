import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Success Class",
  description: "Video Calling App",
  icons: {
    icon: "/icons/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="en">
        <ClerkProvider
          appearance={{
            layout: {
              logoImageUrl: "/icons/logo.svg",
              socialButtonsVariant: "iconButton",
            },
          }}
        >
          <body className={`${roboto.className} bg-dark-2`}>
            {children}
            <Toaster />
          </body>
        </ClerkProvider>
      </html>
    </>
  );
}
