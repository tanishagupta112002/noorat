import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function unauthorized() {
  return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      alternative_mobile_number: true,
      dob: true,
    },
  });

  return Response.json({ success: true, user });
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return unauthorized();

  const body = await req.json();
  const hasNameFields = Object.prototype.hasOwnProperty.call(body, "firstName") || Object.prototype.hasOwnProperty.call(body, "lastName");
  const hasField = (field: string) => Object.prototype.hasOwnProperty.call(body, field);
  const data: Record<string, unknown> = {};

  if (hasNameFields) {
    const fullName = `${body.firstName ?? ""} ${body.lastName ?? ""}`.trim();
    data.name = fullName || null;
  }

  if (hasField("phone")) data.phone = body.phone ?? null;
  if (hasField("address")) data.address = body.address ?? null;
  if (hasField("city")) data.city = body.city ?? null;
  if (hasField("state")) data.state = body.state ?? null;
  if (hasField("pincode")) data.pincode = body.pincode ?? null;
  if (hasField("alternative_mobile_number")) data.alternative_mobile_number = body.alternative_mobile_number ?? null;
  if (hasField("dob")) data.dob = body.dob ? new Date(body.dob) : null;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      name: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      alternative_mobile_number: true,
      dob: true,
    },
  });

  return Response.json({ success: true, user });
}