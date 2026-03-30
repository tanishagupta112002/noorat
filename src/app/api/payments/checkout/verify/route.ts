export async function POST() {
  return Response.json(
    {
      success: false,
      error: "Payment verification endpoint is disabled. Checkout now uses manual QR UPI confirmation.",
      code: "VERIFY_DISABLED",
    },
    { status: 410 }
  );
}
