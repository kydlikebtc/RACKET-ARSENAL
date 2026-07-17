import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "拍库｜找到和你打法同频的下一把球拍",
    description: "按打球阶段、打法风格和六维属性筛选、匹配与对比代表性网球拍，并直达品牌官网购买。",
    applicationName: "拍库 RACKET ARSENAL",
    openGraph: {
      title: "拍库｜RACKET ARSENAL",
      description: "从规格走向打法，找到和你同频的下一把武器。",
      type: "website",
      locale: "zh_CN",
      images: [{ url: `${origin}/og-app.png`, width: 1652, height: 952, alt: "拍库球拍发现与对比 App" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "拍库｜RACKET ARSENAL",
      description: "从规格走向打法，找到和你同频的下一把武器。",
      images: [`${origin}/og-app.png`],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1013" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
