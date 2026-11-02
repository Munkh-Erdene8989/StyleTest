export type ResponseContent = { type: string; text?: string; image_url?: string; detail?: string };

export type ResponsesRequest = {
  model: string;
  timeoutMs: number;
  maxOutputTokens?: number;
  reasoningEffort?: "low";
  instructions?: string;
  developer?: string;
  user: string | ResponseContent[];
  schemaName: string;
  schema: object;
};

export type ChatJson = {
  json: unknown;
  inputTokens: number;
  outputTokens: number;
};

export type ImageRequest = {
  model: string;
  prompt: string;
  size: string;
  outputFormat: "png" | "jpeg";
  quality?: "medium";
  timeoutMs: number;
  reference?: { bytes: Buffer; mime: string };
};

export type ModelImage = {
  bytes: Buffer;
  base64: string;
  inputTokens: number;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function authHeaders(json: boolean) {
  return {
    authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    ...(json ? { "content-type": "application/json" } : {}),
  };
}

function clipDetail(text: string, max: number) {
  return text.replace(/\s+/g, " ").slice(0, max);
}

export async function responsesJson(input: ResponsesRequest): Promise<unknown> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(input.timeoutMs),
    headers: authHeaders(true),
    body: JSON.stringify({
      model: input.model,
      store: false,
      ...(input.reasoningEffort ? { reasoning: { effort: input.reasoningEffort } } : {}),
      ...(input.maxOutputTokens ? { max_output_tokens: input.maxOutputTokens } : {}),
      ...(input.instructions ? { instructions: input.instructions } : {}),
      input: input.developer
        ? [
            { role: "developer", content: input.developer },
            { role: "user", content: input.user },
          ]
        : [{ role: "user", content: input.user }],
      text: { format: { type: "json_schema", name: input.schemaName, strict: true, schema: input.schema } },
    }),
  });
  if (!response.ok) {
    const detail = clipDetail(await response.text(), 180);
    throw new Error(`model_http_${response.status}:${detail}`);
  }
  const json = (await response.json()) as {
    status?: string;
    output_text?: string;
    output?: { content?: { type?: string; text?: string }[] }[];
  };
  if (json.status && json.status !== "completed") throw new Error("incomplete");
  const refused = json.output?.some((item) => item.content?.some((part) => part.type === "refusal"));
  if (refused) throw new Error("refused");
  const text = json.output_text || json.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text")?.text || "";
  return JSON.parse(text) as unknown;
}

export async function chatJson(input: { model: string; system: string; user: string; timeoutMs: number }): Promise<ChatJson> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(input.timeoutMs),
    headers: authHeaders(true),
    body: JSON.stringify({
      model: input.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });
  if (!response.ok) throw new Error("model_http");
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("schema_invalid");
  return {
    json: JSON.parse(match[0]) as unknown,
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
  };
}

export async function renderImage(input: ImageRequest): Promise<ModelImage> {
  let last = "image_failed";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = input.reference?.bytes.length
      ? await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          signal: AbortSignal.timeout(input.timeoutMs),
          headers: authHeaders(false),
          body: editForm(input),
        })
      : await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          signal: AbortSignal.timeout(input.timeoutMs),
          headers: authHeaders(true),
          body: JSON.stringify({
            model: input.model,
            prompt: input.prompt,
            size: input.size,
            ...(input.quality ? { quality: input.quality } : {}),
            n: 1,
            output_format: input.outputFormat,
          }),
        });
    if ((response.status === 429 || response.status >= 500) && attempt === 0) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitSec = Math.min(20, Math.max(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 0, 2));
      await delay(waitSec * 1000);
      last = `image_http_${response.status}`;
      continue;
    }
    if (!response.ok) {
      const detail = clipDetail(await response.text(), 160);
      throw new Error(`image_http_${response.status}:${detail}`);
    }
    const json = (await response.json()) as {
      data?: { b64_json?: string }[];
      usage?: { input_tokens?: number };
    };
    const base64 = json.data?.[0]?.b64_json;
    if (!base64) throw new Error("image_empty");
    return {
      bytes: Buffer.from(base64, "base64"),
      base64,
      inputTokens: json.usage?.input_tokens ?? Math.ceil((input.reference?.bytes.length ?? 0) / 1000),
    };
  }
  throw new Error(last);
}

function editForm(input: ImageRequest) {
  const mime = input.reference?.mime === "image/png" || input.reference?.mime === "image/webp" ? input.reference.mime : "image/jpeg";
  const form = new FormData();
  form.append("model", input.model);
  form.append("prompt", input.prompt);
  form.append("size", input.size);
  if (input.quality) {
    form.append("quality", input.quality);
    form.append("n", "1");
  }
  form.append("output_format", input.outputFormat);
  form.append("image[]", new Blob([new Uint8Array(input.reference?.bytes ?? Buffer.alloc(0))], { type: mime }), "source.jpg");
  return form;
}
