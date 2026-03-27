"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  RENTAL_CATEGORY_OPTIONS,
  RENTAL_COLOR_OPTIONS,
  RENTAL_SIZE_OPTIONS,
} from "@/lib/rental-listing-options";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InventoryListing = {
  id: string;
  title: string;
  fabric: string;
  size: string;
  images: string[];
  category: string;
  color: string;
  originalPrice: number;
  price: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

type InventoryManagerProps = {
  initialListings: InventoryListing[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateIso));
}

function hasOption(options: string[], value: string) {
  const normalizedValue = value.trim().toLowerCase();
  return options.some((option) => option.trim().toLowerCase() === normalizedValue);
}

export function InventoryManager({ initialListings }: InventoryManagerProps) {
  const [listings, setListings] = useState(initialListings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, Omit<InventoryListing, "createdAt" | "updatedAt" | "images">>
  >({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<
    Record<string, number>
  >({});
  const [uploadFiles, setUploadFiles] = useState<Record<string, File[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingImageMap, setDeletingImageMap] = useState<
    Record<string, boolean>
  >({});

  const appendUploadFiles = (listingId: string, files: File[]) => {
    setUploadFiles((prev) => {
      const existing = prev[listingId] || [];
      const combined = [...existing, ...files];
      const uniqueBySignature = new Map<string, File>();

      for (const file of combined) {
        const signature = `${file.name}-${file.size}-${file.lastModified}`;
        uniqueBySignature.set(signature, file);
      }

      return {
        ...prev,
        [listingId]: Array.from(uniqueBySignature.values()),
      };
    });
  };

  const listingMap = useMemo(() => {
    const map = new Map<string, InventoryListing>();
    for (const listing of listings) {
      map.set(listing.id, listing);
    }
    return map;
  }, [listings]);

  const startEdit = (listingId: string) => {
    const listing = listingMap.get(listingId);
    if (!listing) return;

    setEditingId(listingId);
    setDrafts((prev) => ({
      ...prev,
      [listingId]: {
        id: listing.id,
        title: listing.title,
        fabric: listing.fabric,
        size: listing.size,
        category: listing.category,
        color: listing.color,
        originalPrice: listing.originalPrice,
        price: listing.price,
        status: listing.status,
      },
    }));
  };

  const cancelEdit = (listingId: string) => {
    setEditingId((current) => (current === listingId ? null : current));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[listingId];
      return next;
    });
  };

  const saveEdit = async (listingId: string) => {
    const draft = drafts[listingId];
    if (!draft) return;

    try {
      setSavingId(listingId);
      const response = await fetch(`/api/provider/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          fabric: draft.fabric,
          size: draft.size,
          category: draft.category,
          color: draft.color,
          originalPrice: draft.originalPrice,
          price: draft.price,
          status: draft.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        toast.error(data?.error || "Unable to update listing");
        return;
      }

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? {
                ...listing,
                title: data.listing.title,
                fabric: data.listing.Fabric,
                size: data.listing.size,
                category: data.listing.category,
                color: data.listing.color,
                originalPrice: data.listing.originalPrice,
                price: data.listing.price,
                status: data.listing.status,
                images: data.listing.images,
                updatedAt: data.listing.updatedAt,
              }
            : listing,
        ),
      );
      setEditingId(null);
      toast.success("Listing updated");
    } catch {
      toast.error("Unable to update listing right now");
    } finally {
      setSavingId(null);
    }
  };

  const deleteListing = async (listingId: string) => {
    const confirmed = window.confirm("Delete this listing permanently?");
    if (!confirmed) return;

    try {
      setDeletingId(listingId);
      const response = await fetch(`/api/provider/listings/${listingId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        toast.error(data?.error || "Unable to delete listing");
        return;
      }

      setListings((prev) => prev.filter((listing) => listing.id !== listingId));
      toast.success("Listing deleted");
    } catch {
      toast.error("Unable to delete listing right now");
    } finally {
      setDeletingId(null);
    }
  };

  const uploadMorePhotos = async (listingId: string) => {
    const files = uploadFiles[listingId] || [];
    if (files.length === 0) {
      toast.error("Select image files first");
      return;
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append("images", file);
    }

    try {
      setUploadingId(listingId);
      const response = await fetch(
        `/api/provider/listings/${listingId}/photos`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json();
      if (!response.ok || !data?.success) {
        toast.error(data?.error || "Unable to upload photos");
        return;
      }

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? {
                ...listing,
                images: data.listing.images,
                updatedAt: data.listing.updatedAt,
              }
            : listing,
        ),
      );
      setUploadFiles((prev) => ({ ...prev, [listingId]: [] }));
      toast.success("Photos added successfully");
    } catch {
      toast.error("Unable to upload photos right now");
    } finally {
      setUploadingId(null);
    }
  };

  const deleteImage = async (listingId: string, imageUrl: string) => {
    const confirmed = window.confirm("Delete this image?");
    if (!confirmed) return;

    const imageKey = `${listingId}-${imageUrl}`;
    try {
      setDeletingImageMap((prev) => ({ ...prev, [imageKey]: true }));
      const response = await fetch(
        `/api/provider/listings/${listingId}/photos`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data?.success) {
        toast.error(data?.error || "Unable to delete image");
        return;
      }

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? {
                ...listing,
                images: data.listing.images,
                updatedAt: data.listing.updatedAt,
              }
            : listing,
        ),
      );
      setSelectedImageIndex((prev) => {
        const newIndex = { ...prev };
        delete newIndex[listingId];
        return newIndex;
      });
      toast.success("Image deleted");
    } catch {
      toast.error("Unable to delete image right now");
    } finally {
      setDeletingImageMap((prev) => {
        const next = { ...prev };
        delete next[imageKey];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 [&_input:disabled]:opacity-90 [&_select:disabled]:opacity-90">
      <div className="flex flex-wrap mb-10 items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Manage every product like a full marketplace item detail page.
          </p>
        </div>
        <Button asChild>
          <Link href="/provider/add-stock">Add New Stock</Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="rounded-[24px] border-border/70 bg-white/70 shadow-sm">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Your inventory is empty. Add your first product to start receiving
            orders.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {listings.map((listing) => {
            const isEditing = editingId === listing.id;
            const draft = drafts[listing.id];
            const current = isEditing && draft ? draft : listing;
            const activeImageIndex = selectedImageIndex[listing.id] ?? 0;
            const activeImage =
              listing.images[activeImageIndex] || listing.images[0];
            const pendingUploadFiles = uploadFiles[listing.id] || [];

            return (
              <Card
                key={listing.id}
                className="rounded-[26px] border-border/70 bg-white/80 shadow-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-4">
                        <CardTitle className="text-xl">
                          {listing.title}
                        </CardTitle>

                        <Badge variant={listing.status ? "default" : "outline"}>
                          {listing.status ? "Active" : "Paused"}
                        </Badge>
                      </div>

                      <CardDescription>
                        Created {formatDate(listing.createdAt)} · Last updated{" "}
                        {formatDate(listing.updatedAt)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!isEditing ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => startEdit(listing.id)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            onClick={() => saveEdit(listing.id)}
                            disabled={savingId === listing.id}
                          >
                            {savingId === listing.id ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => cancelEdit(listing.id)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => deleteListing(listing.id)}
                        disabled={deletingId === listing.id}
                      >
                        {deletingId === listing.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    {/* Left Column - Images Only */}
                    <div className="space-y-3">
                      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
                        {activeImage ? (
                          <Image
                            src={activeImage}
                            alt={listing.title}
                            fill
                            className="object-contain p-2"
                            sizes="(max-width:1024px)100vw, 50vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {listing.images.map((image, index) => {
                          const imageKey = `${listing.id}-${image}`;
                          const isDeleting = deletingImageMap[imageKey];
                          return (
                            <div
                              key={`${listing.id}-thumb-${index}`}
                              className="group relative h-16 w-16"
                            >
                              <div className="relative h-full w-full overflow-hidden rounded-xl border transition-all group-hover:shadow-md">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedImageIndex((prev) => ({
                                      ...prev,
                                      [listing.id]: index,
                                    }))
                                  }
                                  className="h-full w-full"
                                >
                                  <Image
                                    src={image}
                                    alt={`${listing.title} ${index + 1}`}
                                    fill
                                    className="object-contain p-1"
                                    sizes="64px"
                                  />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteImage(listing.id, image)}
                                disabled={isDeleting}
                                className="absolute right-0 top-0 flex h-6 w-6 -translate-y-2 translate-x-2 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 disabled:opacity-50"
                                title="Delete image"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column - All Details + Add Photos Section */}
                    <div className="space-y-3">
                      <div className="grid gap-10 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Title</Label>
                          <Input
                            value={current.title}
                            disabled={!isEditing}
                            onChange={(event) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [listing.id]: {
                                  ...(prev[listing.id] || current),
                                  title: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>

                        <CustomSelect
                          label="Category"
                          value={current.category}
                          disabled={!isEditing}
                          onValueChange={(value) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [listing.id]: {
                                ...(prev[listing.id] || current),
                                category: value,
                              },
                            }))
                          }
                          options={[
                            ...(!hasOption(
                              RENTAL_CATEGORY_OPTIONS.map((item) => item.label),
                              current.category,
                            )
                              ? [{ value: current.category, label: current.category }]
                              : []),
                            ...RENTAL_CATEGORY_OPTIONS.map((item) => ({
                              value: item.label,
                              label: item.label,
                            })),
                          ]}
                        />

                        <div className="space-y-2">
                          <Label>Fabric</Label>
                          <Input
                            value={current.fabric}
                            disabled={!isEditing}
                            onChange={(event) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [listing.id]: {
                                  ...(prev[listing.id] || current),
                                  fabric: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>

                        <CustomSelect
                          label="Size"
                          value={current.size}
                          disabled={!isEditing}
                          onValueChange={(value) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [listing.id]: {
                                ...(prev[listing.id] || current),
                                size: value,
                              },
                            }))
                          }
                          options={[
                            ...(!hasOption(RENTAL_SIZE_OPTIONS, current.size)
                              ? [{ value: current.size, label: current.size }]
                              : []),
                            ...RENTAL_SIZE_OPTIONS.map((size) => ({
                              value: size,
                              label: size,
                            })),
                          ]}
                        />

                        <CustomSelect
                          label="Color"
                          value={current.color}
                          disabled={!isEditing}
                          onValueChange={(value) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [listing.id]: {
                                ...(prev[listing.id] || current),
                                color: value,
                              },
                            }))
                          }
                          options={[
                            ...(!hasOption(RENTAL_COLOR_OPTIONS, current.color)
                              ? [{ value: current.color, label: current.color }]
                              : []),
                            ...RENTAL_COLOR_OPTIONS.map((color) => ({
                              value: color,
                              label: color,
                            })),
                          ]}
                        />

                        <div className="space-y-2">
                          <Label>Original Price (INR)</Label>
                          <Input
                            type="number"
                            value={current.originalPrice}
                            disabled={!isEditing}
                            onChange={(event) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [listing.id]: {
                                  ...(prev[listing.id] || current),
                                  originalPrice: Number(event.target.value || 0),
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Price (INR)</Label>
                          <Input
                            type="number"
                            value={current.price}
                            disabled={!isEditing}
                            onChange={(event) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [listing.id]: {
                                  ...(prev[listing.id] || current),
                                  price: Number(event.target.value || 0),
                                },
                              }))
                            }
                          />
                        </div>

                        <CustomSelect
                          label="Status"
                          disabled={!isEditing}
                          value={current.status ? "active" : "paused"}
                          onValueChange={(value) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [listing.id]: {
                                ...(prev[listing.id] || current),
                                status: value === "active",
                              },
                            }))
                          }
                          options={[
                            { value: "active", label: "Active" },
                            { value: "paused", label: "Paused" },
                          ]}
                        />

                        <div className="rounded-2xl bg-muted/60 p-4 sm:col-span-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Current prices
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="text-2xl font-semibold text-foreground">
                              {formatCurrency(current.price)}
                            </p>
                            <p className="text-base text-muted-foreground line-through">
                              {formatCurrency(current.originalPrice)}
                            </p>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Photos: {listing.images.length}
                          </p>
                        </div>
                      </div>

                      {/* Add Photos Section at Bottom */}
                      <div className="rounded-2xl border border-dashed border-border/80 p-3">
                        <p className="mb-2 text-sm font-medium">
                          Add more photos
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                              appendUploadFiles(
                                listing.id,
                                Array.from(event.target.files || []),
                              );
                              event.currentTarget.value = "";
                            }}
                            className="max-w-sm"
                          />
                          <Button
                            type="button"
                            onClick={() => uploadMorePhotos(listing.id)}
                            disabled={uploadingId === listing.id}
                          >
                            {uploadingId === listing.id
                              ? "Uploading..."
                              : "Upload Photos"}
                          </Button>
                        </div>
                        {pendingUploadFiles.length > 0 ? (
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Ready to upload: {pendingUploadFiles.length}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                setUploadFiles((prev) => ({
                                  ...prev,
                                  [listing.id]: [],
                                }))
                              }
                            >
                              Clear
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
