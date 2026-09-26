import { afterEach, describe, expect, it, vi } from "vitest";
import { STYLE_DIRECTIONS } from "@/domain/content";
import type { ResultBand } from "@/domain/types";
import { providers } from "./ai";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const outline = ["Зан төлөвийн тайлбар", "Давуу тал", "Анзаарах хэв маяг", "Өдөр тутмын жишээ"];

const band: ResultBand = {
  id: "b",
  min: 0,
  max: 10,
  title: "тайван",
  summary: "товч",
  detail: ["давуу", "анзаарах"],
  paidOutline: outline,
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

describe("openai providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_TEXT_MODEL;
    delete process.env.OPENAI_IMAGE_MODEL;
  });

  it("returns a template when the key is missing", async () => {
    const result = await providers.explainPersonality({ band, outline, answers: [] });
    expect(result.draft.source).toBe("template");
    expect(result.costUsd).toBe(0);
  });

  it("parses a chat completion into a personality draft", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_INPUT_USD_PER_MTOK = "2";
    process.env.OPENAI_OUTPUT_USD_PER_MTOK = "8";
    const payload = { sections: outline.map((heading) => ({ heading, body: "тайлбар" })) };
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
      const headers = init?.headers as Record<string, string>;
      expect(headers.authorization).toBe("Bearer test-key");
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("gpt-4.1");
      expect(body.response_format).toEqual({ type: "json_object" });
      return jsonResponse({
        choices: [{ message: { content: JSON.stringify(payload) } }],
        usage: { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await providers.explainPersonality({
      band,
      outline,
      answers: [{ question: "асуулт", answer: "хариу" }],
    });
    expect(result.draft.source).toBe("model");
    expect(result.model).toBe("gpt-4.1");
    expect(result.costUsd).toBe(10);
    delete process.env.OPENAI_INPUT_USD_PER_MTOK;
    delete process.env.OPENAI_OUTPUT_USD_PER_MTOK;
  });

  it("keeps the style template when the model JSON does not match", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn(async () => jsonResponse({ choices: [{ message: { content: "{\"unexpected\":true}" } }] }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await providers.explainStyle({
      directions: [STYLE_DIRECTIONS[0]],
      comfort: "сул",
      lifestyle: "mixed",
      request: "",
    });
    expect(result.draft.source).toBe("template");
    expect(result.draft.directions[0]?.id).toBe(STYLE_DIRECTIONS[0].id);
  });

  it("generates without a photo and edits when a photo is present", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const direction = STYLE_DIRECTIONS[0];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers.authorization).toBe("Bearer test-key");
      if (String(url).endsWith("/images/generations")) {
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe("gpt-image-1");
        expect(body.output_format).toBe("png");
      }
      if (String(url).endsWith("/images/edits")) {
        expect(init?.body).toBeInstanceOf(FormData);
        const form = init?.body as FormData;
        expect(form.get("model")).toBe("gpt-image-1");
        expect(form.getAll("image[]")).toHaveLength(1);
      }
      return jsonResponse({ data: [{ b64_json: PNG.toString("base64") }], usage: { input_tokens: 12 } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const generated = await providers.renderImage({ direction });
    const edited = await providers.renderImage({ direction, face: PNG });
    expect(generated.provider).toBe("openai");
    expect(generated.contentType).toBe("image/png");
    expect(edited.bytes.equals(PNG)).toBe(true);
    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toEqual([
      "https://api.openai.com/v1/images/generations",
      "https://api.openai.com/v1/images/edits",
    ]);
  });
});
