import { AppError } from "@/domain/errors";
import { getStore } from "./store";

const COLOR_PLATES = {
  BW: "Bright-Winter-гарын-авлага.pdf",
  DA: "Dark-Autumn-гарын-авлага.pdf",
  DW: "Dark-Winter-гарын-авлага.pdf",
  LS: "Light-Summer-гарын-авлага.pdf",
  SA: "Soft-Autumn-гарын-авлага.pdf",
  SS: "Soft-Summer-гарын-авлага.pdf",
  TA: "True-Autumn-гарын-авлага.pdf",
  TS: "True-Summer-гарын-авлага.pdf",
  TW: "True-Winter-гарын-авлага.pdf",
} as const;

export type ColorPlateCode = keyof typeof COLOR_PLATES;

export function colorPlate(code: string) {
  const key = code.toUpperCase();
  if (!(key in COLOR_PLATES)) return null;
  const plate = key as ColorPlateCode;
  return {
    code: plate,
    filename: COLOR_PLATES[plate],
    path: `color-plates/${plate}.pdf`,
  };
}

export function plateContentDisposition(filename: string) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function readColorPlate(code: string) {
  const plate = colorPlate(code);
  if (!plate) return null;
  const object = await getStore().getObject(plate.path);
  if (!object) throw new AppError("plate_missing", 500);
  return { bytes: object.bytes, filename: plate.filename };
}
