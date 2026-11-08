import "./globals.css";

export const metadata = {
  title: "Nexora AI — Your Intelligent Chat Assistant",
  description:
    "Nexora AI is a powerful AI assistant for coding, studying, creative writing, and general questions. Chat with Nexora for instant, intelligent answers.",
  keywords: "AI assistant, ChatGPT alternative, coding AI, study AI, Nexora AI",
  authors: [{ name: "Nexora AI" }],
  openGraph: {
    title: "Nexora AI",
    description: "Your intelligent AI chat assistant",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7C3AED",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined") {
                window.addEventListener("unhandledrejection", function(e) {
                  const msg = e?.reason?.message || "";
                  const stack = e?.reason?.stack || "";
                  if (stack.includes("chrome-extension://") || msg.includes("chrome:")) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                });
                window.addEventListener("error", function(e) {
                  const file = e?.filename || "";
                  const stack = e?.error?.stack || "";
                  if (file.includes("chrome-extension://") || stack.includes("chrome-extension://")) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
