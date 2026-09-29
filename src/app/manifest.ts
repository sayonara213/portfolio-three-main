import type { MetadataRoute } from "next";
import { DESCRIPTION, NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${NAME} Portfolio`,
    short_name: NAME,
    description: DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
