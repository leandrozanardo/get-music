"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { downloadFromApi } from "@/lib/download"

type DownloadTab = {
  id: string
  label: string
  endpoint: string
  placeholder: string
  description: string
  buttonLabel: string // idle CTA; playlists download a zip, not a single MP3
}

const DOWNLOAD_TABS: DownloadTab[] = [
  {
    id: "youtube-track",
    label: "YouTube",
    endpoint: "/api/youtube/track",
    placeholder: "https://www.youtube.com/watch?v=...",
    description: "Cole o link de um vídeo do YouTube.",
    buttonLabel: "Baixar MP3",
  },
  {
    id: "youtube-playlist",
    label: "Playlist YouTube",
    endpoint: "/api/youtube/playlist",
    placeholder: "https://www.youtube.com/playlist?list=...",
    description: "Cole o link de uma playlist do YouTube.",
    buttonLabel: "Baixar playlist",
  },
  {
    id: "spotify-playlist",
    label: "Spotify",
    endpoint: "/api/spotify/playlist",
    placeholder: "https://open.spotify.com/playlist/...",
    description: "Cole o link de uma playlist do Spotify.",
    buttonLabel: "Baixar playlist",
  },
]

export function DownloadPanel() {
  const [activeTab, setActiveTab] = useState(DOWNLOAD_TABS[0].id)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loadingTab, setLoadingTab] = useState<string | null>(null)

  const activeConfig =
    DOWNLOAD_TABS.find((tab) => tab.id === activeTab) ?? DOWNLOAD_TABS[0]
  const currentUrl = urls[activeConfig.id] ?? ""

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedUrl = currentUrl.trim()
    if (!trimmedUrl) {
      toast.error("Informe uma URL válida.")
      return
    }

    setLoadingTab(activeConfig.id)

    try {
      const filename = await downloadFromApi(activeConfig.endpoint, trimmedUrl)
      toast.success(`Download iniciado: ${filename}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível baixar."
      toast.error(message)
    } finally {
      setLoadingTab(null)
    }
  }

  return (
    <div className="w-full max-w-xl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          {DOWNLOAD_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {DOWNLOAD_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor={`url-${tab.id}`}>URL</Label>
                <Input
                  id={`url-${tab.id}`}
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={tab.placeholder}
                  value={urls[tab.id] ?? ""}
                  disabled={loadingTab !== null}
                  onChange={(event) =>
                    setUrls((previous) => ({
                      ...previous,
                      [tab.id]: event.target.value,
                    }))
                  }
                />
                <p className="text-sm text-muted-foreground">{tab.description}</p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loadingTab !== null}
              >
                {loadingTab === tab.id ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Baixando...
                  </>
                ) : (
                  tab.buttonLabel
                )}
              </Button>
            </form>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
