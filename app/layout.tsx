import type { Metadata } from "next"
import { DM_Sans, Syne } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "get-music",
  description: "Baixe faixas e playlists do YouTube e Spotify em MP3.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${syne.variable} ${dmSans.variable} dark h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "border border-border/70 bg-card/95 text-foreground backdrop-blur-sm",
            },
          }}
        />
      </body>
    </html>
  )
}
