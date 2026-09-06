function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim())
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i)
  if (quotedMatch?.[1]) {
    return quotedMatch[1]
  }

  const plainMatch = contentDisposition.match(/filename=([^;\n]+)/i)
  if (plainMatch?.[1]) {
    return plainMatch[1].trim().replace(/^"|"$/g, "")
  }

  return null
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Falha no download (${response.status})`

  try {
    const contentType = response.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as {
        message?: string
        error?: string
      }
      return payload.message ?? payload.error ?? fallback
    }

    const text = (await response.text()).trim()
    return text || fallback
  } catch {
    return fallback
  }
}

export async function downloadFromApi(
  endpoint: string,
  url: string
): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const blob = await response.blob()
  const filename =
    parseFilename(response.headers.get("Content-Disposition")) ?? "download"

  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)

  return filename
}
