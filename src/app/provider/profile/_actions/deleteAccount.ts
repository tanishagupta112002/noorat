"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteAccount() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return { success: false };
	}

	await prisma.session.deleteMany({
		where: {
			userId: session.user.id,
		},
	});

	await prisma.user.delete({
		where: {
			id: session.user.id,
		},
	});

	return { success: true };
}