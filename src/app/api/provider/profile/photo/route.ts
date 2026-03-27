import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function getBlobTokenOrThrow(): string {
  const token =
    (typeof process.env.BLOB_READ_WRITE_TOKEN === "string" &&
      process.env.BLOB_READ_WRITE_TOKEN.trim()) ||
    (typeof process.env.VERCEL_BLOB_READ_WRITE_TOKEN === "string" &&
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN.trim()) ||
    "";

  if (!token) {
    throw new Error(
      "Vercel Blob token is missing. Set BLOB_READ_WRITE_TOKEN (or VERCEL_BLOB_READ_WRITE_TOKEN)."
    );
  }

  return token;
}

async function getProviderProfile(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return null;

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, profilePhoto: true },
  });

  return profile;
}

function buildFileName(providerId: string, file: File) {
  const extByMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  const extension = extByMime[file.type] || ".jpg";
  return `${providerId}-${Date.now()}${extension}`;
}

async function removeExistingFile(blobUrl: string | null | undefined) {
  if (!blobUrl) return;

  try {
    await del(blobUrl, { token: getBlobTokenOrThrow() });
  } catch {
    // Ignore missing files and continue.
  }
}

export async function POST(req: Request) {
  try {
    const profile = await getProviderProfile(req);
    if (!profile) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const photo = formData.get("photo");

    if (!(photo instanceof File) || photo.size === 0) {
      return Response.json({ success: false, error: "Select an image to upload" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(photo.type)) {
      return Response.json({ success: false, error: "Only JPG, PNG, and WEBP images are allowed" }, { status: 400 });
    }

    if (photo.size > MAX_SIZE_BYTES) {
      return Response.json({ success: false, error: "Profile photo must be smaller than 5MB" }, { status: 400 });
    }

    const fileName = `provider-profile/${buildFileName(profile.id, photo)}`;
    const blob = await put(fileName, photo, {
      access: "public",
      token: getBlobTokenOrThrow(),
    });

    const updatedProfile = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: { profilePhoto: blob.url },
      select: { profilePhoto: true },
    });

    await removeExistingFile(profile.profilePhoto);

    return Response.json({ success: true, profilePhoto: updatedProfile.profilePhoto });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ success: false, error: error.message }, { status: 400 });
    }

    return Response.json({ success: false, error: "Failed to upload profile photo" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const profile = await getProviderProfile(req);
    if (!profile) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: { profilePhoto: null },
    });

    await removeExistingFile(profile.profilePhoto);

    return Response.json({ success: true, profilePhoto: null });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ success: false, error: error.message }, { status: 400 });
    }

    return Response.json({ success: false, error: "Failed to remove profile photo" }, { status: 500 });
  }
}
