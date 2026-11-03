import { describe, expect, it } from "vitest";
import { cleanOperations, DEFAULT_OPERATIONS, operationsFrom } from "./site-operations";

describe("site operations", () => {
  it("keeps the current homepage when nothing is saved", () => {
    const ops = operationsFrom(undefined);
    expect(ops.heroTitle).toBe("Өөрийн өнгөөр");
    expect(ops.services).toHaveLength(4);
    expect(ops.services[0].href).toBe("tel");
    expect(ops.services[3].href).toBe("/quiz");
    expect(ops.gallery).toHaveLength(6);
  });

  it("saves an edited service and drops unsafe links", () => {
    const next = cleanOperations({
      ...DEFAULT_OPERATIONS,
      heroTitle: "Шинэ гарчиг",
      services: [
        {
          title: "Өнгөний цаг",
          subtitle: "Color",
          description: "Нэг цагийн уулзалт.",
          includes: ["Палитр"],
          image: "https://evil.example/a.jpg",
          tag: "",
          href: "javascript:alert(1)",
          action: "Захиалах",
        },
      ],
      facebook: "https://not-facebook.example/x",
      mapsEmbed: "javascript:alert(1)",
    });
    expect(next.heroTitle).toBe("Шинэ гарчиг");
    expect(next.services).toHaveLength(1);
    expect(next.services[0].href).toBe("tel");
    expect(next.services[0].image).toBe(DEFAULT_OPERATIONS.services[0].image);
    expect(next.facebook).toBe(DEFAULT_OPERATIONS.facebook);
    expect(next.mapsEmbed).toBe(DEFAULT_OPERATIONS.mapsEmbed);
  });
});
