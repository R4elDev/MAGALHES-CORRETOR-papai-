import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const artwork = await readFile(join(process.cwd(), "public", "magalhaes", "favicon-casas-v2.png"));

  // Next renders and caches a small square icon instead of sending the full-size artwork to the tab.
  return new ImageResponse(
    <img src={`data:image/png;base64,${artwork.toString("base64")}`} alt="" width={64} height={64} />,
    size,
  );
}
