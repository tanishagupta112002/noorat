"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomSelect } from "@/components/ui/custom-select";
import { deleteAccount } from "../_actions/deleteAccount";

const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;

const providerProfileSchema = z.object({
  profilePhoto: z.string().optional(),
  businessName: z.string().max(120, "Business name is too long").optional(),
  providerType: z.enum(["BOUTIQUE", "RENTAL", ""]).optional(),
  phone: z.string().regex(phoneRegex, "Enter a valid Indian mobile number"),
  alternativeMobileNumber: z
    .string()
    .optional()
    .refine(
      (value) => !value || phoneRegex.test(value),
      "Enter a valid alternate Indian mobile number",
    ),
  address: z.string().max(200, "Address is too long").optional(),
  city: z.string().max(80, "City is too long").optional(),
  state: z.string().max(80, "State is too long").optional(),
  pincode: z
    .string()
    .optional()
    .refine(
      (value) => !value || pincodeRegex.test(value),
      "Pincode must be 6 digits",
    ),
  description: z.string().max(600, "Description is too long").optional(),
  bankAccountName: z
    .string()
    .max(120, "Account holder name is too long")
    .optional(),
  bankAccountNumber: z
    .string()
    .max(40, "Account number is too long")
    .optional(),
  bankIfsc: z
    .string()
    .optional()
    .refine(
      (value) => !value || ifscRegex.test(value),
      "Enter a valid IFSC code",
    ),
});

type ProviderProfileFormValues = z.infer<typeof providerProfileSchema>;

type ProviderProfileEditFormProps = {
  initialValues: ProviderProfileFormValues;
};

function normalizePhone(value: string) {
  const compact = value.trim().replace(/[\s-]/g, "");
  if (compact.startsWith("+91")) return compact;
  return `+91${compact}`;
}

export function ProviderProfileEditForm({
  initialValues,
}: ProviderProfileEditFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [currentProfilePhoto, setCurrentProfilePhoto] = useState(
    initialValues.profilePhoto?.trim() || "",
  );
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(
    null,
  );

  const form = useForm<ProviderProfileFormValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: initialValues,
  });

  const watchedPhone = form.watch("phone") || "";
  const isPhoneChanged =
    normalizePhone(watchedPhone || "") !==
    normalizePhone(initialValues.phone || "");

  const resetEditState = () => {
    form.reset(initialValues);
    setIsEditing(false);
    setOtpSent(false);
    setIsPhoneVerified(false);
    setPhoneOtp("");

    if (pendingPhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(pendingPhotoPreview);
    }
    setPendingPhotoPreview(null);
    setPendingPhotoFile(null);
  };

  const displayProfilePhoto = pendingPhotoPreview || currentProfilePhoto;

  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed");
      event.target.value = "";
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error("Profile photo must be smaller than 5MB");
      event.target.value = "";
      return;
    }

    if (pendingPhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(pendingPhotoPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setPendingPhotoFile(file);
    setPendingPhotoPreview(objectUrl);
  };

  const handleRemoveProfilePhoto = async () => {
    try {
      setIsRemovingPhoto(true);

      const response = await fetch("/api/provider/profile/photo", {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        toast.error(data?.error || "Unable to remove profile photo");
        return;
      }

      if (pendingPhotoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(pendingPhotoPreview);
      }

      setCurrentProfilePhoto("");
      setPendingPhotoFile(null);
      setPendingPhotoPreview(null);
      toast.success("Profile photo removed");
      router.refresh();
    } catch {
      toast.error("Unable to remove profile photo right now");
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      router.push("/account");
      router.refresh();
    } catch {
      toast.error("Unable to switch to customer mode right now.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDelete = async () => {
    if (deleteText !== "DELETE") {
      toast.error("Type DELETE to confirm account deletion");
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteAccount();

      if (!response?.success) {
        toast.error("Unable to delete account");
        return;
      }

      toast.success("Account deleted successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong while deleting account");
    } finally {
      setIsDeleting(false);
    }
  };

  const sendPhoneOtp = async () => {
    const valid = await form.trigger("phone");
    if (!valid) {
      toast.error("Enter a valid phone number before requesting OTP");
      return;
    }

    try {
      setIsSendingOtp(true);
      const response = await fetch("/api/provider/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-phone-otp", phone: watchedPhone }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        toast.error(data?.error || data?.message || "Unable to send OTP");
        return;
      }

      setOtpSent(true);
      setIsPhoneVerified(false);
      setPhoneOtp("");
      toast.success(data?.message || "OTP sent");
    } catch {
      toast.error("Unable to send OTP right now");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyPhoneOtp = async () => {
    if (!phoneOtp.trim()) {
      toast.error("Enter OTP to verify phone");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const response = await fetch("/api/provider/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-phone-otp",
          phone: watchedPhone,
          otp: phoneOtp.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        setIsPhoneVerified(false);
        toast.error(data?.error || data?.message || "OTP verification failed");
        return;
      }

      setIsPhoneVerified(true);
      toast.success("Phone number verified");
    } catch {
      setIsPhoneVerified(false);
      toast.error("Unable to verify OTP right now");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (isPhoneChanged && !isPhoneVerified) {
      toast.error("Verify the new phone number with OTP before saving");
      return;
    }

    try {
      setIsSaving(true);
      let uploadedProfilePhoto = currentProfilePhoto;

      if (pendingPhotoFile) {
        setIsUploadingPhoto(true);

        const photoFormData = new FormData();
        photoFormData.append("photo", pendingPhotoFile);

        const photoResponse = await fetch("/api/provider/profile/photo", {
          method: "POST",
          body: photoFormData,
        });

        const photoData = await photoResponse.json();
        if (!photoResponse.ok || !photoData?.success) {
          toast.error(photoData?.error || "Unable to upload profile photo");
          return;
        }

        uploadedProfilePhoto = photoData.profilePhoto || "";
        setCurrentProfilePhoto(uploadedProfilePhoto);

        if (pendingPhotoPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(pendingPhotoPreview);
        }
        setPendingPhotoFile(null);
        setPendingPhotoPreview(null);
      }

      const { profilePhoto: _ignoredProfilePhoto, ...restValues } = values;
      const payload = {
        ...restValues,
        providerType: values.providerType || undefined,
        phoneOtp: isPhoneChanged ? phoneOtp.trim() : undefined,
      };

      const response = await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        toast.error(data?.error || "Unable to update profile");
        return;
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      setOtpSent(false);
      setIsPhoneVerified(false);
      setPhoneOtp("");
      setCurrentProfilePhoto(uploadedProfilePhoto);
      router.refresh();
    } catch {
      toast.error("Something went wrong while updating profile");
    } finally {
      setIsUploadingPhoto(false);
      setIsSaving(false);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 -mt-6 [&_input:disabled]:opacity-90 [&_textarea:disabled]:opacity-90 [&_select:disabled]:opacity-90"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          You can update your store, contact, and payout details from here.
        </p>
        {!isEditing ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isSaving || isUploadingPhoto || isRemovingPhoto}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetEditState}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-border/70">
              <AvatarImage src={displayProfilePhoto || undefined} alt="Provider profile photo" />
              <AvatarFallback className="text-sm font-semibold">
                {(form.watch("businessName") || initialValues.businessName || "P")
                  .trim()
                  .charAt(0)
                  .toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">Profile photo</p>
              <p className="text-xs text-muted-foreground">
                Upload a clear JPG, PNG, or WEBP image up to 5MB.
              </p>
            </div>
          </div>

          {isEditing ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoFileChange}
                disabled={isSaving || isUploadingPhoto || isRemovingPhoto}
                className="max-w-65"
              />
              {displayProfilePhoto ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveProfilePhoto}
                  disabled={isSaving || isUploadingPhoto || isRemovingPhoto}
                >
                  {isRemovingPhoto ? "Removing..." : "Remove photo"}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            disabled={!isEditing}
            placeholder="Your business name"
            {...form.register("businessName")}
          />
          {form.formState.errors.businessName ? (
            <p className="text-sm text-red-500">
              {form.formState.errors.businessName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <CustomSelect
            id="providerType"
            label="Provider type"
            disabled={!isEditing}
            options={[
              { value: "BOUTIQUE", label: "Boutique" },
              { value: "RENTAL", label: "Rental" },
            ]}
            {...form.register("providerType")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            disabled={!isEditing}
            placeholder="10 digit phone number or +91XXXXXXXXXX"
            {...form.register("phone", {
              onChange: () => {
                setIsPhoneVerified(false);
                setOtpSent(false);
                setPhoneOtp("");
              },
            })}
          />
          {form.formState.errors.phone ? (
            <p className="text-sm text-red-500">
              {form.formState.errors.phone.message}
            </p>
          ) : null}
          {isEditing && isPhoneChanged ? (
            <div className="mt-2 space-y-2 rounded-md border border-border/70 bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                Phone number changed. OTP verification is required.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={sendPhoneOtp}
                  disabled={isSendingOtp}
                >
                  {isSendingOtp
                    ? "Sending OTP..."
                    : otpSent
                      ? "Resend OTP"
                      : "Send OTP"}
                </Button>
                <Input
                  placeholder="Enter 6-digit OTP"
                  value={phoneOtp}
                  onChange={(event) => {
                    setPhoneOtp(event.target.value);
                    setIsPhoneVerified(false);
                  }}
                  disabled={!otpSent}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={verifyPhoneOtp}
                  disabled={!otpSent || isVerifyingOtp}
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>
              {isPhoneVerified ? (
                <p className="text-xs font-medium text-green-600">
                  Phone number verified successfully.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            disabled={!isEditing}
            placeholder="6-digit pincode"
            {...form.register("pincode")}
          />
          {form.formState.errors.pincode ? (
            <p className="text-sm text-red-500">
              {form.formState.errors.pincode.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            disabled={!isEditing}
            placeholder="City"
            {...form.register("city")}
          />
          {form.formState.errors.city ? (
            <p className="text-sm text-red-500">
              {form.formState.errors.city.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            disabled={!isEditing}
            placeholder="State"
            {...form.register("state")}
          />
          {form.formState.errors.state ? (
            <p className="text-sm text-red-500">
              {form.formState.errors.state.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          disabled={!isEditing}
          rows={3}
          placeholder="Pickup or business address"
          {...form.register("address")}
        />
        {form.formState.errors.address ? (
          <p className="text-sm text-red-500">
            {form.formState.errors.address.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Store description</Label>
        <Textarea
          id="description"
          disabled={!isEditing}
          rows={4}
          placeholder="Tell customers about your collection and style"
          {...form.register("description")}
        />
        {form.formState.errors.description ? (
          <p className="text-sm text-red-500">
            {form.formState.errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="bankAccountName">Account holder name</Label>
          <Input
            id="bankAccountName"
            disabled={!isEditing}
            placeholder="Name on bank account"
            {...form.register("bankAccountName")}
          />
          {form.formState.errors.bankAccountName ? (
            <p className="text-sm text-red-500">
              {form.formState.errors.bankAccountName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccountNumber">Account number</Label>
          <Input
            id="bankAccountNumber"
            disabled={!isEditing}
            placeholder="Bank account number"
            {...form.register("bankAccountNumber")}
          />
          {form.formState.errors.bankAccountNumber ? (
            <p className="text-sm text-red-500">
              {form.formState.errors.bankAccountNumber.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankIfsc">IFSC</Label>
          <Input
            id="bankIfsc"
            disabled={!isEditing}
            placeholder="IFSC code"
            {...form.register("bankIfsc")}
          />
          {form.formState.errors.bankIfsc ? (
            <p className="text-sm text-red-500">
              {form.formState.errors.bankIfsc.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-foreground">Account actions</p>
            <p className="text-sm text-muted-foreground">
              Exit provider mode or permanently delete your account.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut || isDeleting}
            >
              {isLoggingOut ? "Switching..." : "Exit Provider Mode"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  disabled={isDeleting || isLoggingOut}
                >
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is permanent and cannot be undone. Type DELETE
                    below to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2">
                  <Label htmlFor="delete-confirmation">Type DELETE</Label>
                  <Input
                    id="delete-confirmation"
                    value={deleteText}
                    onChange={(event) => setDeleteText(event.target.value)}
                    placeholder="DELETE"
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDelete();
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </form>
  );
}
