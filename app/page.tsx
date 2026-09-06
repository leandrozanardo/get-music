import { DownloadPanel } from "@/components/download-panel"

export default function Home() {
  return (
    <div className="club-atmosphere relative min-h-screen overflow-hidden">
      <div aria-hidden className="club-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="club-noise pointer-events-none absolute inset-0" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16">
        <header className="mb-10 w-full text-center">
          <p className="font-heading text-xs tracking-[0.35em] text-primary uppercase">
            get-music
          </p>
          <h1 className="font-heading mt-3 text-5xl leading-none font-extrabold tracking-tight text-foreground sm:text-6xl">
            GET MUSIC
          </h1>
          <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
            De URL a MP3 em segundos.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground/80">
            Cole o link, escolha a origem e baixe — sem dashboard, sem
            complicação.
          </p>
        </header>

        <DownloadPanel />
      </main>
    </div>
  )
}
