import { afterEach, describe, expect, it, vi } from "vitest";
import { renderImage, responsesJson } from "./model-transport";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const schema = {
  type: "object",
  additionalProperties: false,
  properties: { summary: { type: "string" } },
  required: ["summary"],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("model transport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.OPENAI_API_KEY;
  });

  it("reads a completed responses payload and rejects refusal or an unfinished run", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.input[0]).toEqual({ role: "developer", content: "заавар" });
      expect(body.text.format.name).toBe("report_palette");
      if (body.model === "refuse") {
        return jsonResponse({ status: "completed", output: [{ content: [{ type: "refusal", text: "үгүй" }] }] });
      }
      if (body.model === "partial") return jsonResponse({ status: "incomplete" });
      return jsonResponse({ status: "completed", output_text: "{\"summary\":\"болсон\"}" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const request = { timeoutMs: 1000, developer: "заавар", user: "өгөгдөл", schemaName: "report_palette", schema };
    await expect(responsesJson({ ...request, model: "ok" })).resolves.toEqual({ summary: "болсон" });
    await expect(responsesJson({ ...request, model: "refuse" })).rejects.toThrow("refused");
    await expect(responsesJson({ ...request, model: "partial" })).rejects.toThrow("incomplete");
  });

  it("keeps the HTTP status on a failed responses call", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("  busy  now ", { status: 503 })));
    await expect(
      responsesJson({ model: "m", timeoutMs: 1000, user: "x", schemaName: "n", schema }),
    ).rejects.toThrow("model_http_503: busy now");
  });

  it("retries a busy image once, then returns the bytes", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.useFakeTimers();
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) return new Response("later", { status: 429, headers: { "retry-after": "2" } });
        return jsonResponse({ data: [{ b64_json: PNG.toString("base64") }], usage: { input_tokens: 4 } });
      }),
    );
    const pending = renderImage({
      model: "gpt-image-2.5-sunburst",
      prompt: "палитр",
      size: "1024x1024",
      outputFormat: "jpeg",
      quality: "medium",
      timeoutMs: 30_000,
    });
    await vi.advanceTimersByTimeAsync(2000);
    const image = await pending;
    expect(calls).toBe(2);
    expect(image.bytes.equals(PNG)).toBe(true);
    expect(image.inputTokens).toBe(4);
  });
});
