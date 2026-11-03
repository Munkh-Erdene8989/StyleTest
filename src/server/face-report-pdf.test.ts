import { describe, expect, it } from "vitest";
import { FACE_MANIFEST, applyLocated, assertLandscapePdf, placeCallout, printHtmlToPdf, renderQuizReportHtml, resolveReferencePhoto, type FaceDraft } from "./face-report-pdf";
import { reportDesign } from "./report-design";
import { MANIFESTS, developerPrompt, imageJobsFor, imagePrompt, userMessage } from "./report-prompts";

const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function fixture(): FaceDraft {
  return {
    reportId: "aiq_test",
    briefSections: [{ heading: "Хувийн нүүрний чиглэл", body: "Хариултаас гарсан нэг чиглэл." }],
    images: { 1: PIXEL, 16: PIXEL, 24: PIXEL },
    captions: {},
    pages: FACE_MANIFEST.map((item) => ({
      page_number: item.page,
      intro_mn: "Хариултаас гарсан нэг чиглэл.",
      edit_en: "A narrow brim that leaves this forehead visible.",
      recommendations: [{ action_mn: "Нэг акцент сонго", why_mn: "Хариултын контраст өндөр." }],
      callouts: item.page === 3 ? [{ title: "Нүд", text: "Зөөлөн туяа", side: "R" as const, cx: 590, cy: 300, size: 150 }] : [],
    })),
  };
}

describe("face report pdf", () => {
  it("renders the 25-page face manifest", () => {
    expect(FACE_MANIFEST).toHaveLength(25);
    expect(FACE_MANIFEST.map((item) => item.page)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    const html = renderQuizReportHtml(fixture(), "face_beauty");
    expect(html.match(/class="report-page/g)).toHaveLength(25);
    expect(html).toContain("1/25");
    expect(html).toContain("25/25");
    expect(html).toContain("Хариултаас гарсан нэг чиглэл.");
    expect(html).toContain("Нүд");
    expect(html).not.toContain("has-swatches");
    expect(html).not.toContain("Тодруулах сонголт");
    const design = reportDesign() as unknown as Record<string, unknown>;
    expect(design.pages).toBeUndefined();
    expect(JSON.stringify(design)).not.toContain("Тодруулах сонголт");
    expect(html).toContain("object-fit: contain");
    expect(html).not.toContain("split");
    expect(html.match(/class="hero"/g)).toHaveLength(3);
    expect(html.match(/class="step"/g)).toHaveLength(25);
    expect(html.match(/class="logo"/g)).toHaveLength(25);
    expect(html).not.toContain("AI стиль туршилт");
    expect(html).not.toContain("Жишээ зураг · маникен");
    expect(html).toContain("Анхны зураг");
    expect(html).toContain("Өөрчлөхийн өмнө");
    expect(html).toContain("#B08A3E");
    expect(html).toContain("background: #FFFFFF");
    expect(html).not.toContain("#F7F3ED");
  });

  it("reuses a small image plan and keeps outfit edits on the body photo", () => {
    for (const kind of ["face_beauty", "body_shape", "archetype"] as const) {
      const jobs = imageJobsFor(kind);
      const pages = jobs.flatMap((job) => job.pages).sort((a, b) => a - b);
      expect(pages).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
      expect(jobs.length).toBeLessThanOrEqual(kind === "face_beauty" ? 16 : 10);
    }
    const face = imageJobsFor("face_beauty");
    expect(face.filter((job) => job.id.startsWith("makeup_"))).toHaveLength(2);
    expect(face.filter((job) => job.id.startsWith("glasses_"))).toHaveLength(3);
    expect(imagePrompt(face[0], true)).toContain("plain white background");
    expect(imageJobsFor("body_shape").filter((job) => job.kind === "outfit").every((job) => job.role === "body")).toBe(true);
    const archetype = imageJobsFor("archetype");
    expect(archetype.filter((job) => job.kind === "outfit").every((job) => job.role === "body")).toBe(true);
    expect(archetype.filter((job) => job.kind === "still").every((job) => job.role === "none")).toBe(true);
    const shortened = imageJobsFor("face_beauty", ["short"]);
    expect(shortened.some((job) => job.id === "hair_short")).toBe(false);
    expect(shortened.flatMap((job) => job.pages).sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    const outfit = imageJobsFor("body_shape").find((job) => job.kind === "outfit");
    expect(outfit).toBeTruthy();
    expect(imagePrompt(outfit!, true)).toContain("Do not slim the waist");
    expect(imagePrompt(outfit!, true, "", "womenswear")).toContain("Women's clothing only");
    expect(imagePrompt(outfit!, true, "straight trousers", "womenswear")).toContain("No men's shirts");
    expect(imagePrompt(outfit!, false, "", "menswear")).toContain("Men's clothing only");
    expect(imagePrompt(outfit!, false, "", "menswear")).toContain("full-body man fashion mannequin");
    const capsule = imageJobsFor("body_shape").find((job) => job.id === "still_capsule");
    expect(imagePrompt(capsule!, false, "", "womenswear")).toContain("Women's clothing only");
    expect(imagePrompt(outfit!, false)).toContain("mannequin");
    const archetypeLook = imageJobsFor("archetype").find((job) => job.kind === "outfit");
    expect(archetypeLook).toBeTruthy();
    expect(imagePrompt(archetypeLook!, true)).toContain("Do not slim the waist");
    expect(imagePrompt(archetypeLook!, false)).toContain("mannequin");
    expect(imagePrompt(archetypeLook!, true, "a cream shirt and straight trousers", "womenswear")).toContain("Women's clothing only");
    const hat = imageJobsFor("face_beauty").find((job) => job.id === "hat_suit");
    expect(hat).toBeTruthy();
    const personalHat = imagePrompt(hat!, true, "a narrow cloche above a long forehead");
    expect(personalHat).toContain("narrow cloche");
    expect(personalHat).toContain("Hat only");
    expect(personalHat).toContain("No collage");
    expect(personalHat).not.toContain("One soft hat shape");
    expect(imagePrompt(hat!, true, "", "womenswear")).not.toContain("Women's clothing");
    expect(imagePrompt(hat!, true)).not.toContain("narrow cloche");
    expect(imagePrompt(hat!, true)).toContain("One soft hat shape");
    const hatMark = { title: "Малгай", text: "Нарийн хүрээ", side: "R" as const, cx: 512, cy: 140, size: 180 };
    expect(placeCallout("hat_suit", hatMark)).toMatchObject({ cy: 140, size: 320 });
    expect(placeCallout("hat_suit", { ...hatMark, cy: 640 })).toBeNull();
    expect(placeCallout("glasses_suit_a", { ...hatMark, cy: 320, size: 100 })?.size).toBe(260);
    const located = applyLocated(
      [{ title: "Малгай", text: "Нарийн хүрээ" }],
      [{ title: "Малгай", side: "R", cx: 512, cy: 140, size: 180 }],
    );
    expect(located).toEqual([{ title: "Малгай", text: "Нарийн хүрээ", side: "R", cx: 512, cy: 140, size: 180 }]);
    expect(applyLocated([{ title: "Малгай", text: "Нарийн хүрээ" }], [{ title: "Нүд", side: "L", cx: 100, cy: 100, size: 120 }])).toEqual([]);
  });

  it("uses the 25-page instruction for every quiz", () => {
    for (const kind of ["face_beauty", "body_shape", "archetype"] as const) {
      expect(MANIFESTS[kind]).toHaveLength(25);
      expect(MANIFESTS[kind].every((item) => item.imageJobId && (item.kind === "base" || item.kind === "change"))).toBe(true);
      expect(developerPrompt(kind)).toContain("яг 25 хуудастай");
      expect(developerPrompt(kind)).not.toContain("computed_result");
      const message = userMessage({ quiz_type: kind, answers: [{ question: "Асуулт", answer: "Хариулт" }] }, MANIFESTS[kind]);
      expect(message).toContain("PAGE_MANIFEST");
      expect(message).not.toContain("computed_result");
      expect(message).not.toContain("\"cx\"");
      const html = renderQuizReportHtml({ ...fixture(), pages: MANIFESTS[kind].map((item) => ({ ...fixture().pages[0], page_number: item.page })) }, kind);
      expect(html.match(/class="report-page/g)).toHaveLength(25);
    }
    expect(developerPrompt("face_beauty")).toContain("callouts");
    expect(developerPrompt("face_beauty")).toContain("будалт 5");
    expect(developerPrompt("face_beauty")).toContain("зохихгүй");
    expect(developerPrompt("body_shape")).toContain("PAGE_MANIFEST_BODY");
    expect(developerPrompt("archetype")).toContain("PAGE_MANIFEST_ARCHETYPE");
    expect(developerPrompt("archetype")).toContain("dimension_scores");
    expect(developerPrompt("archetype")).toContain("нэг богино өгүүлбэр");
  });

  it("makes a compliant studio photo from a rejected upload and uses that photo next", async () => {
    const upload = Buffer.from("beach");
    const made = Buffer.from("studio");
    const seen: string[] = [];
    let checks = 0;
    const ready = await resolveReferencePhoto({
      kind: "body_shape",
      photo: upload,
      mime: "image/png",
      analyze: async () => ({
        status: "ready",
        quality_issues: [],
        body_label: "hourglass",
        face_label: null,
        observations: [],
        retake_instructions: [],
      }),
      render: async () => {
        throw new Error("should not render a photo that already passes");
      },
    });
    expect(ready.personal).toBe(true);
    expect(ready.photo).toBe(upload);
    expect(ready.notice).toBeUndefined();

    const prepared = await resolveReferencePhoto({
      kind: "body_shape",
      photo: upload,
      mime: "image/png",
      analyze: async ({ bytes }) => {
        checks += 1;
        seen.push(bytes.toString());
        if (checks === 1) {
          return {
            status: "retake",
            quality_issues: ["алхаж байна"],
            body_label: null,
            face_label: null,
            wardrobe: "womenswear" as const,
            observations: [],
            retake_instructions: ["эгц зогсоно уу"],
          };
        }
        return {
          status: "ready",
          quality_issues: [],
          body_label: "hourglass",
          face_label: null,
          wardrobe: "womenswear" as const,
          observations: [],
          retake_instructions: [],
        };
      },
      render: async (args) => {
        expect(args.photo).toBe(upload);
        expect(args.mime).toBe("image/png");
        expect(args.size).toBe("1024x1536");
        expect(args.prompt).toContain("fitted t-shirt and straight trousers");
        expect(args.prompt).toContain("Do not slim");
        expect(args.prompt).toContain("No swimwear");
        expect(args.prompt).toContain("Women's clothing only");
        return { bytes: made, mime: "image/jpeg" };
      },
    });
    expect(seen).toEqual(["beach", "studio"]);
    expect(prepared.personal).toBe(true);
    expect(prepared.photo).toBe(made);
    expect(prepared.mime).toBe("image/jpeg");
    expect(prepared.notice).toContain("шаардлагад нийцсэн зураг");
    expect(prepared.wardrobe).toBe("womenswear");

    const rejected = await resolveReferencePhoto({
      kind: "face_beauty",
      photo: Buffer.from("snap"),
      analyze: async () => ({
        status: "review",
        quality_issues: ["нүүр халхалсан"],
        body_label: null,
        face_label: null,
        observations: [],
        retake_instructions: [],
      }),
      render: async (args) => {
        expect(args.size).toBe("1024x1024");
        expect(args.prompt).toContain("front portrait");
        return { bytes: Buffer.from("still-bad"), mime: "image/jpeg" };
      },
    });
    expect(rejected.personal).toBe(false);
    expect(rejected.notice).toContain("маникен");

    const failed = await resolveReferencePhoto({
      kind: "body_shape",
      photo: Buffer.from("snap"),
      analyze: async () => null,
      render: async () => {
        throw new Error("image_http_400");
      },
    });
    expect(failed.personal).toBe(false);
    expect(failed.notice).toContain("маникен");

    const archetypeReady = await resolveReferencePhoto({
      kind: "archetype",
      photo: upload,
      analyze: async () => ({
        status: "ready",
        quality_issues: [],
        body_label: null,
        face_label: null,
        wardrobe: "menswear",
        observations: [],
        retake_instructions: [],
      }),
      render: async () => {
        throw new Error("should not render a photo that already passes");
      },
    });
    expect(archetypeReady.personal).toBe(true);
    expect(archetypeReady.wardrobe).toBe("menswear");
  });

  it("prints 25 landscape A4 pages", async () => {
    const pdf = await printHtmlToPdf(renderQuizReportHtml(fixture(), "face_beauty"));
    await assertLandscapePdf(pdf);
  }, 60_000);
});
