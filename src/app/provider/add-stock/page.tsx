"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/custom-select";
import {
	RENTAL_CATEGORY_OPTIONS,
	RENTAL_COLOR_OPTIONS,
	RENTAL_SIZE_OPTIONS,
} from "@/lib/rental-listing-options";
import { createStockAction } from "./_actions/create-stock";

const COLOR_SWATCH_MAP: Record<string, string> = {
	"Multi Color": "bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500",
	Red: "bg-red-500", Pink: "bg-pink-400", "Light Pink": "bg-pink-200 border border-border", "Hot Pink": "bg-pink-500",
	"Rose Pink": "bg-rose-400", Blue: "bg-blue-500", "Sky Blue": "bg-sky-300", "Light Blue": "bg-blue-200 border border-border",
	"Royal Blue": "bg-blue-700", "Powder Blue": "bg-sky-200 border border-border", Green: "bg-emerald-500", "Light Green": "bg-green-200 border border-border",
	"Sea Green": "bg-emerald-600", "Lime Green": "bg-lime-500", "Forest Green": "bg-green-800", Yellow: "bg-yellow-400",
	"Light Yellow": "bg-yellow-200 border border-border", "Lemon Yellow": "bg-yellow-300 border border-border", Black: "bg-slate-900",
	Maroon: "bg-red-900", Gold: "bg-yellow-700", Silver: "bg-gray-400", White: "bg-white border border-border",
	Purple: "bg-violet-500", "Light Purple": "bg-violet-200 border border-border", Lilac: "bg-purple-200 border border-border",
	Orange: "bg-orange-500", "Burnt Orange": "bg-orange-700", Brown: "bg-amber-900", "Dark Brown": "bg-stone-800",
	"Coffee Brown": "bg-amber-800", "Chocolate Brown": "bg-amber-950", Tan: "bg-amber-300 border border-border", Camel: "bg-amber-400",
	Beige: "bg-amber-100 border border-border", Cream: "bg-amber-50 border border-border", Ivory: "bg-stone-100 border border-border",
	Grey: "bg-neutral-400", "Light Grey": "bg-neutral-200 border border-border", Charcoal: "bg-zinc-700", Navy: "bg-blue-900",
	Teal: "bg-teal-500", Turquoise: "bg-cyan-400", Aqua: "bg-cyan-300", Cyan: "bg-cyan-500", Mint: "bg-emerald-300",
	Olive: "bg-lime-700", Peach: "bg-orange-200 border border-border", "Light Peach": "bg-orange-100 border border-border",
	Coral: "bg-rose-400", Lavender: "bg-purple-300", Magenta: "bg-fuchsia-600", Mustard: "bg-amber-500", Rust: "bg-orange-700",
	Wine: "bg-rose-900", Burgundy: "bg-red-950", Plum: "bg-purple-800", Mauve: "bg-rose-300 border border-border",
	Periwinkle: "bg-indigo-200 border border-border", Champagne: "bg-yellow-100 border border-border", "Rose Gold": "bg-rose-300",
	Copper: "bg-orange-800", "Off White": "bg-stone-50 border border-border", Nude: "bg-orange-100 border border-border",
	Khaki: "bg-lime-300 border border-border", Emerald: "bg-emerald-700", "Sage Green": "bg-green-300 border border-border",
	"Mint Green": "bg-emerald-200 border border-border", "Pastel Pink": "bg-pink-100 border border-border", "Pastel Blue": "bg-sky-100 border border-border",
	"Pastel Green": "bg-green-100 border border-border", "Pastel Yellow": "bg-yellow-100 border border-border",
};

const COLOR_SEARCH_TERMS: Record<string, string[]> = {
	Yellow: ["haldi", "sunshine", "day wedding"], Green: ["mehndi", "henna", "garden"], Orange: ["haldi", "mehndi", "festive"],
	Gold: ["wedding", "bridal", "festive"], Red: ["bridal", "wedding", "ceremony"], Maroon: ["bridal", "wedding", "reception"],
	Pink: ["engagement", "day party", "bridesmaid"], Blue: ["cocktail", "sangeet", "evening"], Purple: ["sangeet", "cocktail", "night"],
	Black: ["cocktail", "reception", "party"], Silver: ["reception", "cocktail", "glam"], White: ["engagement", "brunch", "minimal"],
};

const SIZE_SEARCH_TERMS: Record<string, string[]> = {
	XS: ["extra small", "petite"], S: ["small", "slim"], M: ["medium", "regular"], L: ["large"],
	XL: ["extra large"], XXL: ["double xl"], "3XL": ["triple xl", "plus"], "4XL": ["extended"], "Free Size": ["free", "adjustable"],
};

const schema = z.object({
	title: z.string().min(2, "Title must be at least 2 characters"),
	description: z.string().max(2000).optional(),
	size: z.string().min(1, "Size is required"),
	originalPrice: z.coerce.number().positive("Original price must be a positive number"),
	price: z.coerce.number().positive("Price must be a positive number"),
	category: z.string().min(1, "Category is required"),
	color: z.string().min(2, "Color is required"),
	images: z.array(z.instanceof(File)).min(1, "At least 1 image required"),
}).refine((data) => data.originalPrice >= data.price, {
	message: "Original price must be greater than or equal to rental price",
	path: ["originalPrice"],
});

type StockFormInput = z.input<typeof schema>;
type StockFormOutput = z.output<typeof schema>;

export default function AddStockPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const form = useForm<StockFormInput, undefined, StockFormOutput>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: "",
			description: "",
			size: "",
			originalPrice: undefined,
			price: undefined,
			category: "",
			color: "",
			images: [],
		},
	});

	const selectedImages = form.watch("images") || [];

	const appendSelectedImages = (files: File[]) => {
		const existing = form.getValues("images") || [];
		const combined = [...existing, ...files];
		const uniqueBySignature = new Map<string, File>();

		for (const file of combined) {
			const signature = `${file.name}-${file.size}-${file.lastModified}`;
			uniqueBySignature.set(signature, file);
		}

		form.setValue("images", Array.from(uniqueBySignature.values()), { shouldValidate: true });
	};

	const onSubmit = form.handleSubmit(
		async (data) => {
			try {
				setIsLoading(true);
				const formData = new FormData();
				formData.append("title", data.title);
				formData.append("description", data.description || "");
				formData.append("size", data.size);
				formData.append("originalPrice", data.originalPrice.toString());
				formData.append("price", data.price.toString());
				formData.append("category", data.category);
				formData.append("color", data.color);
				data.images.forEach((file) => formData.append("images", file));

				const result = await createStockAction(formData);

				if (!result.success) {
					toast.error(result.message || "Failed to add stock");
					return;
				}

			toast.success("Listing successfully added! 🎉");
			setTimeout(() => {
				router.push("/provider/inventory");
			}, 500);
				router.refresh();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "An error occurred");
			} finally {
				setIsLoading(false);
			}
		},
		() => {
			toast.error("Please fix the highlighted form errors");
		}
	);

	return (
		<div className="flex justify-center">
			<Card className="w-full max-w-3xl rounded-[28px] border-border/70 bg-white/70 shadow-sm">
				<CardHeader>
					<CardTitle>Add New Stock</CardTitle>
					<CardDescription>Create a new listing for your provider inventory.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-6">
						<div>
							<Label>Product Title *</Label>
							<Input {...form.register("title")} />
							{form.formState.errors.title ? (
								<p className="mt-1 text-sm text-red-500">{form.formState.errors.title.message}</p>
							) : null}
						</div>

										<div>
											<Label>Product Description</Label>
											<Textarea {...form.register("description")} rows={4} placeholder="Describe fit, embroidery, style, and ideal occasions" />
											{form.formState.errors.description ? (
												<p className="mt-1 text-sm text-red-500">{form.formState.errors.description.message}</p>
											) : null}
										</div>

						<div className="grid gap-6 md:grid-cols-2">
							<div>
								<Label>Original Price (₹) *</Label>
								<Input type="number" {...form.register("originalPrice", { valueAsNumber: true })} />
								{form.formState.errors.originalPrice ? (
									<p className="mt-1 text-sm text-red-500">{form.formState.errors.originalPrice.message}</p>
								) : null}
							</div>

							<div>
								<Label>Rental Price (₹) *</Label>
								<Input type="number" {...form.register("price", { valueAsNumber: true })} />
								{form.formState.errors.price ? (
									<p className="mt-1 text-sm text-red-500">{form.formState.errors.price.message}</p>
								) : null}
							</div>

							<div>
								<CustomSelect
									label="Size *"
									searchable
									searchPlaceholder="Search sizes..."
									options={[
										{ value: "", label: "Select size" },
										...RENTAL_SIZE_OPTIONS.map((size) => ({ 
											value: size, 
											label: size,
											searchTerms: SIZE_SEARCH_TERMS[size],
										})),
									]}
									{...form.register("size")}
								/>
								{form.formState.errors.size ? (
									<p className="mt-1 text-sm text-red-500">{form.formState.errors.size.message}</p>
								) : null}
							</div>

							<div>
								<CustomSelect
									label="Color *"
									searchable
									showColorSwatch
									searchPlaceholder="Search colors..."
									options={[
										{ value: "", label: "Select color" },
										...RENTAL_COLOR_OPTIONS.map((color) => ({ 
											value: color, 
											label: color,
											swatchClass: COLOR_SWATCH_MAP[color] ?? COLOR_SWATCH_MAP["Multi Color"],
											searchTerms: COLOR_SEARCH_TERMS[color],
										})),
									]}
									{...form.register("color")}
								/>
								{form.formState.errors.color ? (
									<p className="mt-1 text-sm text-red-500">{form.formState.errors.color.message}</p>
								) : null}
							</div>
						</div>

						<div>
							<CustomSelect
								label="Category *"
								searchable
								searchPlaceholder="Search categories..."
								options={[
									{ value: "", label: "Select category" },
									...RENTAL_CATEGORY_OPTIONS.map((category) => ({
										value: category.label,
										label: category.label,
										searchTerms: category.aliases,
									})),
								]}
								{...form.register("category")}
							/>
							{form.formState.errors.category ? (
								<p className="mt-1 text-sm text-red-500">{form.formState.errors.category.message}</p>
							) : null}
						</div>

						<div>
							<Label>Images * (at least 1)</Label>
							<Input
								type="file"
								multiple
								accept="image/*"
								onChange={(event) => {
									appendSelectedImages(Array.from(event.target.files || []));
									event.currentTarget.value = "";
								}}
							/>
							<p className="mt-2 text-xs text-muted-foreground">Selected photos: {selectedImages.length}</p>
							{selectedImages.length > 0 ? (
								<div className="mt-2 rounded-xl border border-border/70 bg-background/70 p-3">
									<div className="mb-2 flex items-center justify-between">
										<p className="text-xs font-medium text-foreground">Selected files</p>
										<Button
											type="button"
											variant="ghost"
											className="h-7 px-2 text-xs"
											onClick={() => form.setValue("images", [], { shouldValidate: true })}
										>
											Clear all
										</Button>
									</div>
									<div className="space-y-1">
										{selectedImages.map((file, index) => (
											<p key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="truncate text-xs text-muted-foreground">
												{index + 1}. {file.name}
											</p>
										))}
									</div>
								</div>
							) : null}
							{form.formState.errors.images ? (
								<p className="mt-1 text-sm text-red-500">{form.formState.errors.images.message}</p>
							) : null}
						</div>

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Adding stock..." : "Add New Stock"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}