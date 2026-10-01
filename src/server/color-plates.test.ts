import { describe, expect, it } from "vitest";
import { colorPlate, plateContentDisposition } from "./color-plates";

describe("color plates", () => {
  it("maps a two-letter code to the matching guide", () => {
    expect(colorPlate("ss")).toEqual({
      code: "SS",
      filename: "Soft-Summer-гарын-авлага.pdf",
      path: "color-plates/SS.pdf",
    });
    expect(colorPlate("TA")?.filename).toBe("True-Autumn-гарын-авлага.pdf");
  });

  it("rejects anything that is not a known plate code", () => {
    expect(colorPlate("NARUKA")).toBeNull();
    expect(colorPlate("S")).toBeNull();
    expect(colorPlate("")).toBeNull();
  });

  it("keeps the Mongolian filename in the download header", () => {
    const header = plateContentDisposition("Soft-Summer-гарын-авлага.pdf");
    expect(header).toContain("filename*=UTF-8''");
    expect(decodeURIComponent(header.split("filename*=UTF-8''")[1] ?? "")).toBe("Soft-Summer-гарын-авлага.pdf");
  });
});
