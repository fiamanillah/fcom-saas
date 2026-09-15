import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SyncDocket - Unified Communications, CRM & Courier Dispatch",
    short_name: "SyncDocket",
    description:
      "SyncDocket is a B2B SaaS platform engineered to unify fragmented customer communications, CRM records, and order/courier dispatch into a single operational workspace.",
    start_url: "/",
    display: "standalone",
    background_color: "#090d0b",
    theme_color: "#047857",
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
