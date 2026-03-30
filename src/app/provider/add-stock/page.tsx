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

const schema = z.object({
	title: z.string().min(2, "Title must be at least 2 characters"),
	fabric: z.string().min(2, "Fabric must be at least 2 characters"),
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
			fabric: "",
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
				formData.append("fabric", data.fabric);
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
							<Label>Fabric Type *</Label>
							<Textarea {...form.register("fabric")} rows={3} />
							{form.formState.errors.fabric ? (
								<p className="mt-1 text-sm text-red-500">{form.formState.errors.fabric.message}</p>
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
									options={[
										{ value: "", label: "Select size" },
										...RENTAL_SIZE_OPTIONS.map((size) => ({ value: size, label: size })),
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
									options={[
										{ value: "", label: "Select color" },
										...RENTAL_COLOR_OPTIONS.map((color) => ({ value: color, label: color })),
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
								options={[
									{ value: "", label: "Select category" },
									...RENTAL_CATEGORY_OPTIONS.map((category) => ({
										value: category.label,
										label: category.label,
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