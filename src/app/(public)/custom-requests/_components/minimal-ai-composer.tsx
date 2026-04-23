"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookmarkCheck, BookmarkPlus, ChevronDown, History, ImagePlus, Loader2, Send, X } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/hooks/user-session";

type PreviewApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    requestId?: string | null;
    previewImageUrl: string;
    summary: string;
  };
};

type HistoryApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    items: UserGenerationItem[];
  };
};

type SaveLookApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    requestId: string;
    saved: boolean;
    alreadySaved: boolean;
  };
};

type ChatEntry = {
  id: string;
  requestId?: string | null;
  isSaved?: boolean;
  prompt: string;
  assistantMessage: string;
  imageUrl?: string;
  sourceImagePreviews?: Array<{
    key: string;
    url: string;
    name: string;
  }>;
};

type UserGenerationItem = {
  id: string;
  imageUrl: string | null;
  prompt: string;
  previewSource: string;
  isSaved: boolean;
  createdAt: string;
};

export function MinimalAIComposer() {
  const { session, loading: isSessionLoading } = useSession();
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<UserGenerationItem[]>([]);
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
    return () => {
      for (const entry of chatHistory) {
        for (const preview of entry.sourceImagePreviews || []) {
          URL.revokeObjectURL(preview.url);
        }
      }
    };
  }, [chatHistory]);

  useEffect(() => {
    if (!isHistoryPanelOpen || !session?.user?.id) return;

    let isCancelled = false;
    const loadHistory = async () => {
      setIsHistoryLoading(true);
      setHistoryError(null);

      try {
        const res = await fetch("/api/custom-requests/history", {
          method: "GET",
          signal: AbortSignal.timeout(8000),
        });
        const payload = (await res.json()) as HistoryApiResponse;

        if (!res.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || "Unable to load history right now.");
        }

        if (!isCancelled) {
          setHistoryItems(payload.data.items);
        }
      } catch (err) {
        if (!isCancelled) {
          setHistoryError(err instanceof Error ? err.message : "Unable to load history right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isCancelled = true;
    };
  }, [isHistoryPanelOpen, session?.user?.id]);

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
    if (prompt.trim().length < 1 || isLoading) return;

    const nextPrompt = prompt.trim();
    const chatId = `${Date.now()}`;
    const sourceImagePreviews = files.map((file) => ({
      key: `${chatId}-${file.name}-${file.size}-${file.lastModified}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setIsLoading(true);
    setError(null);
    setChatHistory((prev) => [
      ...prev,
      {
        id: chatId,
        prompt: nextPrompt,
        sourceImagePreviews,
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
        signal: AbortSignal.timeout(12000),
      });

      const payload = (await res.json()) as PreviewApiResponse;
      if (!res.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Preview generation failed. Please try again.");
      }

      const previewData = payload.data;

      setChatHistory((prev) =>
        prev.map((entry) =>
          entry.id === chatId
            ? {
                ...entry,
                requestId: previewData.requestId,
                assistantMessage: previewData.summary || entry.assistantMessage,
                imageUrl: previewData.previewImageUrl,
                isSaved: false,
              }
            : entry,
        ),
      );

      if (session?.user?.id) {
        setHistoryItems((prev) => [
          {
            id: previewData.requestId || `${chatId}-db`,
            imageUrl: previewData.previewImageUrl,
            prompt: nextPrompt,
            previewSource: "preview",
            isSaved: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

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

  const onSaveLook = async (requestId: string) => {
    if (!requestId || isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/custom-requests/save-look", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
        signal: AbortSignal.timeout(10000),
      });

      const payload = (await res.json()) as SaveLookApiResponse;
      if (!res.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Unable to save this generated look.");
      }

      setHistoryItems((prev) => prev.map((item) => (item.id === requestId ? { ...item, isSaved: true } : item)));
      setChatHistory((prev) => prev.map((entry) => (entry.requestId === requestId ? { ...entry, isSaved: true } : entry)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save this generated look.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto mt-8 max-w-2xl">
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
              <div className="flex max-w-[70%] flex-col items-end gap-2">
                <div className="rounded-xl bg-[#557a7f] px-4 py-3 text-sm font-medium text-white shadow-sm">
                  {entry.prompt}
                </div>

                {entry.sourceImagePreviews?.length ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    {entry.sourceImagePreviews.map((preview) => (
                      <div key={preview.key} className="relative overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
                        <img src={preview.url} alt={preview.name} className="h-20 w-20 object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Generated response</p>
              <div className="max-w-[70%] rounded-xl bg-[#f1eef0] px-4 py-3 text-sm text-foreground shadow-sm">
                {entry.assistantMessage}
              </div>
            </div>

            {entry.imageUrl ? (
              <div className="flex items-start gap-3">
                {/*
                  Square AI image in a LANDSCAPE container → object-cover scales
                  to fill width (192px) → image renders 192×192 inside 192×128
                  → 64px vertical overflow → objectPosition "50% 100%" skips
                  top 64px (33%) so head/face area is fully cropped.
                */}
                <button
                  type="button"
                  onClick={() => setFullscreenImageUrl(entry.imageUrl!)}
                  className="relative h-40 w-48 shrink-0 overflow-hidden rounded-2xl border border-border/70 shadow-sm"
                >
                  <img
                    src={entry.imageUrl}
                    alt="AI preview"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "50% 100%" }}
                  />
                </button>
                {session?.user?.id && entry.requestId ? (
                  <button
                    type="button"
                    onClick={() => onSaveLook(entry.requestId!)}
                    disabled={Boolean(entry.isSaved) || isSaving}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {entry.isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                    {entry.isSaved ? "Saved" : "Save"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}

      </div>

      <div className="relative">
        <div className="absolute -top-11 right-1 flex items-center gap-3 sm:right-1 sm:top-2">
          <Sheet open={isHistoryPanelOpen} onOpenChange={setIsHistoryPanelOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex flex-col items-center text-xs text-foreground/70 transition hover:text-foreground"
              >
                <History className="h-4.5 w-4.5" />
                <span>AI History</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[92vw] overflow-y-auto p-5 sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Your AI History</SheetTitle>
                <SheetDescription>
                  Your generated AI looks appear here.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-3">
                {!isSessionLoading && !session?.user?.id ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Please log in to view your AI history.
                  </div>
                ) : null}

                {isHistoryLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading history...
                  </div>
                ) : null}

                {historyError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {historyError}
                  </p>
                ) : null}

                {!isHistoryLoading && session?.user?.id && historyItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    No generated looks yet.
                  </div>
                ) : null}

                {historyItems.map((item) => (
                  <div key={item.id} className="space-y-2 rounded-2xl border border-border/70 bg-white p-3">
                    <div className="flex items-start gap-3">
                      {item.imageUrl ? (
                        <div className="h-40 w-48 shrink-0 overflow-hidden rounded-xl bg-muted">
                          <img
                            src={item.imageUrl}
                            alt="Generated look"
                            className="h-full w-full object-cover"
                            style={{ objectPosition: "50% 100%" }}
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="line-clamp-2 text-sm text-foreground/90">{item.prompt}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <button
                          type="button"
                          onClick={() => onSaveLook(item.id)}
                          disabled={item.isSaved || isSaving}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {item.isSaved ? <BookmarkCheck className="h-3 w-3" /> : <BookmarkPlus className="h-3 w-3" />}
                          {item.isSaved ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="rounded-3xl border border-border/70 bg-white px-4 py-4 shadow-sm sm:px-5">
        <textarea
          aria-label="Describe your idea"
          placeholder="Ask the NOORAT AI Assistant..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="h-14 w-full resize-none border-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />

        {filePreviews.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {filePreviews.map((preview) => (
              <div key={preview.key} className="relative overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
                <img src={preview.url} alt={preview.name} className="h-16 w-16 object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveFile(preview.key)}
                  className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

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

      {fullscreenImageUrl ? (
        <div
          className="fixed inset-0 z-10001 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setFullscreenImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenImageUrl(null)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="h-[min(82vh,680px)] w-[min(94vw,1020px)] overflow-hidden rounded-2xl border border-white/20 bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fullscreenImageUrl}
              alt="Generated look full preview"
              className="h-full w-full object-cover"
              style={{ objectPosition: "50% 100%" }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
