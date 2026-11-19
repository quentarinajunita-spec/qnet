import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Q-net",
    short_name: "Q-net",
    description: "Ruang karya digital untuk kreator.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaff",
    theme_color: "#6c5ce7",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
