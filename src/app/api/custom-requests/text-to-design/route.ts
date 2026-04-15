export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const prompt = String(formData.get("prompt") || "").trim();

    if (prompt.length < 12) {
      return Response.json(
        { success: false, error: "Prompt must be at least 12 characters" },
        { status: 400 }
      );
    }

    const body = new FormData();
    body.append("inputType", "text");
    body.append("prompt", prompt);

    const occasion = String(formData.get("occasion") || "").trim();
    const budget = String(formData.get("budget") || "").trim();
    const sourceImage = formData.get("sourceImage");

    if (occasion) body.append("occasion", occasion);
    if (budget) body.append("budget", budget);
    if (sourceImage instanceof File && sourceImage.size > 0) {
      body.append("sourceImage", sourceImage);
    }

    const upstream = await fetch(new URL("/api/custom-requests/generate", req.url), {
      method: "POST",
      body,
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: String(error instanceof Error ? error.message : error),
      },
      { status: 500 }
    );
  }
}
