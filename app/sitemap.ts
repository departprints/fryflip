import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://fryflip.example/",
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
