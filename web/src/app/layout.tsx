import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  weight: ["700"],
  style: ["italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: { icon: [{ url: "/favicon.ico", type: "image/x-icon" }] },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "InteractiveWorkout — Your body is the controller",
  description:
    "An endless runner you control with real movement. Jump, squat, and dodge with your camera — no hardware needed. Join the waitlist.",
  openGraph: {
    title: "InteractiveWorkout — Your body is the controller",
    description:
      "An endless runner you control with real movement. Jump, squat, and dodge with your camera — no hardware needed.",
    images: [{ url: "/og-image.png", width: 1731, height: 909, alt: "InteractiveWorkout — Your body is the controller" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InteractiveWorkout — Your body is the controller",
    description:
      "An endless runner you control with real movement. Jump, squat, and dodge with your camera — no hardware needed.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${chakraPetch.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-night text-white" suppressHydrationWarning>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
