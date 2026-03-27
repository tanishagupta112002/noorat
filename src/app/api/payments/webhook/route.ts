export async function POST() {
	return Response.json(
		{
			success: false,
			message: "Webhook handler not configured yet.",
		},
		{ status: 501 }
	);
}
