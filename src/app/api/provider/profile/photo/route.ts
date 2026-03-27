import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "provider-profile");

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

  const extFromName = path.extname(file.name || "").toLowerCase();
  const extension = extFromName || extByMime[file.type] || ".bin";

  return `${providerId}-${Date.now()}${extension}`;
}

function toAbsoluteUploadPath(relativePath: string) {
  if (!relativePath.startsWith("/uploads/provider-profile/")) return null;
  const fileName = path.basename(relativePath);
  return path.join(UPLOAD_DIR, fileName);
}

async function removeExistingFile(relativePath: string | null | undefined) {
  if (!relativePath) return;

  const absolutePath = toAbsoluteUploadPath(relativePath);
  if (!absolutePath) return;

  try {
    await unlink(absolutePath);
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

    await mkdir(UPLOAD_DIR, { recursive: true });

    const fileName = buildFileName(profile.id, photo);
    const absolutePath = path.join(UPLOAD_DIR, fileName);
    const relativePath = `/uploads/provider-profile/${fileName}`;

    await writeFile(absolutePath, Buffer.from(await photo.arrayBuffer()));

    const updatedProfile = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: { profilePhoto: relativePath },
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
