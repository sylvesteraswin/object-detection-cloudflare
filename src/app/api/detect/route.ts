import { env } from "@/env";
import { objectDetection } from "@huggingface/inference";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function json(data: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

export const POST = async (req: Request) => {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return json(
      { error: "Content-Type must be multipart/form-data" },
      { status: 400 }
    );
  }

  const form = await req.formData();
  const fileField = form.get("file");

  if (!(fileField instanceof Blob)) {
    return json({ error: "No file provided" }, { status: 400 });
  }
  if (!fileField.type.startsWith("image/")) {
    return json({ error: "File must be an image" }, { status: 400 });
  }

  const accountId = env.HF_ACCOUNT_ID;
  const gatewayId = env.HF_GATEWAY_ID;
  const model = env.HF_MODEL_SERVER; // could be parameterized later
  const apiToken = env.HF_API_KEY;
  const endpoint = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/huggingface/${model}`;

  const thresholdStr = form.get("threshold");
  let threshold = 0.9; // default
  if (thresholdStr !== null && thresholdStr !== "") {
    const parsed = Number(thresholdStr);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
      return json({ error: "Invalid threshold (0-1)" }, { status: 400 });
    }
    threshold = parsed;
  }

  console.log("Forwarding (base64 JSON) to Cloudflare AI Gateway", {
    endpoint,
    size: fileField.size,
    type: fileField.type,
    threshold,
  });

  try {
    const arrayBuf = await fileField.arrayBuffer();
    const b64 = Buffer.from(arrayBuf).toString("base64");
    const contentTypeHeader = fileField.type || "application/octet-stream";

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        inputs: `data:${contentTypeHeader};base64,${b64}`,
        parameters: { threshold },
      }),
      signal: req.signal,
      cache: "no-store",
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      throw new Error(
        `Upstream error ${upstream.status} ${upstream.statusText} ${errText}`
      );
    }

    const raw: Awaited<ReturnType<typeof objectDetection>> =
      await upstream.json();
    // Return raw upstream response; client will normalize.
    if (!Array.isArray(raw)) {
      console.warn("Upstream response not array", raw);
    } else {
      console.log(`Detections (raw) count: ${raw.length}`);
    }
    return json({ detections: raw, threshold });
  } catch (err) {
    console.error("Object detection error:", err);
    return json(
      { error: (err as Error)?.message || "Unknown error" },
      { status: 500 }
    );
  }
};
