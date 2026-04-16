"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ImageIcon, ImagePlus, Loader2, Send, X } from "lucide-react";

type PreviewApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    previewImageUrl: string;
    summary: string;
  };
};

type ChatEntry = {
  id: string;
  prompt: string;
  assistantMessage: string;
  imageUrl?: string;
};

type GalleryItem = {
  id: string;
  imageUrl: string;
  prompt: string;
};

const GALLERY_STORAGE_KEY = "noorat-custom-gallery";

export function MinimalAIComposer() {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const filePreviews = useMemo(
    () =>
      files.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const preview of filePreviews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [filePreviews]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GALLERY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as GalleryItem[];
      if (Array.isArray(parsed)) {
        setGalleryItems(parsed);
      }
    } catch {
      // Ignore malformed gallery cache.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleryItems.slice(0, 60)));
    } catch {
      // Ignore storage quota and serialization issues.
    }
  }, [galleryItems]);

  const onSelectFiles = (nextFiles: File[]) => {
    const merged = [...files, ...nextFiles].slice(0, 4);
    setFiles(merged);
  };

  const onRemoveFile = (key: string) => {
    setFiles((prev) =>
      prev.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== key),
    );
  };

  const onSubmit = async () => {
    if (prompt.trim().length < 12 || isLoading) return;

    const nextPrompt = prompt.trim();
    const chatId = `${Date.now()}`;
    setIsLoading(true);
    setError(null);
    setChatHistory((prev) => [
      ...prev,
      {
        id: chatId,
        prompt: nextPrompt,
        assistantMessage: `I'll generate a few images for you featuring ${nextPrompt}.`,
      },
    ]);

    const body = new FormData();
    body.append("prompt", nextPrompt);
    files.forEach((file) => body.append("sourceImages", file));

    try {
      const res = await fetch("/api/custom-requests/preview", {
        method: "POST",
        body,
      });

      const payload = (await res.json()) as PreviewApiResponse;
      if (!res.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Preview generate nahi hua. Please retry.");
      }

      const previewData = payload.data;

      setChatHistory((prev) =>
        prev.map((entry) =>
          entry.id === chatId
            ? { ...entry, assistantMessage: previewData.summary || entry.assistantMessage, imageUrl: previewData.previewImageUrl }
            : entry,
        ),
      );
      setGalleryItems((prev) => [
        {
          id: `${chatId}-image`,
          imageUrl: previewData.previewImageUrl,
          prompt: nextPrompt,
        },
        ...prev,
      ]);
      setPrompt("");
      setFiles([]);
    } catch (err) {
      setChatHistory((prev) =>
        prev.map((entry) =>
          entry.id === chatId
            ? { ...entry, assistantMessage: err instanceof Error ? err.message : "Something went wrong." }
            : entry,
        ),
      );
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-8 max-w-5xl">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          const nextFiles = Array.from(event.target.files || []);
          onSelectFiles(nextFiles);
          event.currentTarget.value = "";
        }}
      />

      <div className="space-y-5 pb-8">
        {chatHistory.map((entry) => (
          <div key={entry.id} className="space-y-4">
            <div className="flex justify-end">
              <div className="max-w-[70%] rounded-xl bg-[#557a7f] px-4 py-3 text-sm font-medium text-white shadow-sm">
                {entry.prompt}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Thought for 1 seconds</p>
              <div className="max-w-[70%] rounded-xl bg-[#f1eef0] px-4 py-3 text-sm text-foreground shadow-sm">
                {entry.assistantMessage}
              </div>
            </div>

            {entry.imageUrl ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Create Model</p>
                <div className="max-w-3xl overflow-hidden rounded-3xl border border-border/70 bg-white p-3 shadow-sm">
                  <img src={entry.imageUrl} alt="AI preview" className="h-112 w-full rounded-2xl bg-white object-contain" />
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {filePreviews.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {filePreviews.map((preview) => (
              <div key={preview.key} className="relative overflow-hidden rounded-xl border border-border/70 bg-white">
                <img src={preview.url} alt={preview.name} className="h-20 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveFile(preview.key)}
                  className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative">
        <Link
          href="/custom-requests/gallery"
          className="absolute -top-11 right-1 inline-flex flex-col items-center text-xs text-foreground/70 transition hover:text-foreground sm:-right-18 sm:top-3"
        >
          <ImageIcon className="h-4.5 w-4.5" />
          <span>Gallery</span>
        </Link>

        <div className="rounded-3xl border border-border/70 bg-white px-4 py-4 shadow-sm sm:px-5">
        <textarea
          aria-label="Describe your idea"
          placeholder="Ask the NOORAT AI Assistant..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="h-14 w-full resize-none border-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />

        {error ? (
          <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center overflow-hidden rounded-2xl border border-border bg-muted/30 text-foreground"
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium">
                <ImagePlus className="h-4.5 w-4.5" />
                Add images
              </span>
              <span className="border-l border-border px-2.5 py-2">
                <ChevronDown className="h-4.5 w-4.5" />
              </span>
            </button>
          </div>

          <button
            type="button"
            aria-label="Send prompt"
            onClick={onSubmit}
            disabled={isLoading || prompt.trim().length < 12}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e3137] text-white disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}
