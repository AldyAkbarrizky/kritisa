import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://kritisa.vercel.app", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://kritisa.vercel.app/masuk", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://kritisa.vercel.app/cerpen", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  ];
}
