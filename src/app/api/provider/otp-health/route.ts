import { auth } from "@/lib/auth";

type TwilioHealth = {
  ok: boolean;
  message: string;
};

async function checkTwilioAuth(): Promise<TwilioHealth> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    return {
      ok: false,
      message: "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN",
    };
  }

  const authHeader = Buffer.from(`${sid}:${token}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authHeader}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const reason =
      (body as { message?: string } | null)?.message ||
      `Twilio auth failed with status ${response.status}`;

    return { ok: false, message: reason };
  }

  return { ok: true, message: "Twilio credentials verified" };
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { ok: false, message: "Health check endpoint is disabled in production" },
      { status: 403 }
    );
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const hasFromNumber = Boolean(process.env.TWILIO_PHONE_NUMBER);
  const hasMessagingService = Boolean(process.env.TWILIO_MESSAGING_SERVICE_SID);
  const hasVerifyService = Boolean(process.env.TWILIO_VERIFY_SERVICE_SID);
  const hasOtpSecret = Boolean(process.env.MOBILE_OTP_SECRET);

  if (!hasFromNumber && !hasMessagingService && !hasVerifyService) {
    return Response.json(
      {
        ok: false,
        message: "Set TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID or TWILIO_VERIFY_SERVICE_SID",
        checks: {
          hasFromNumber,
          hasMessagingService,
          hasVerifyService,
          hasOtpSecret,
        },
      },
      { status: 400 }
    );
  }

  const twilio = await checkTwilioAuth();
  const ok = twilio.ok;

  return Response.json(
    {
      ok,
      message: twilio.message,
      checks: {
        hasFromNumber,
        hasMessagingService,
        hasVerifyService,
        hasOtpSecret,
      },
    },
    { status: ok ? 200 : 400 }
  );
}
