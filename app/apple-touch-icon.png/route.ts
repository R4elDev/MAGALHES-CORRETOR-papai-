import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
  const artwork = await readFile(join(process.cwd(), "public", "magalhaes", "favicon-casas-v2.png"));

  return new ImageResponse(
    createElement("img", {
      src: `data:image/png;base64,${artwork.toString("base64")}`,
      alt: "",
      width: 180,
      height: 180,
    }),
    { width: 180, height: 180 },
  );
}
