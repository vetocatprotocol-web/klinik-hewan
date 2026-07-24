"use server";

import { createSupabaseAdmin } from "../lib/storage";

const BUCKETS = [
  {
    name: "avatars",
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    name: "products",
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    name: "clinic",
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    name: "documents",
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["application/pdf"],
  },
  {
    name: "uploads",
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
  },
];

export async function bootstrapStorageBuckets(): Promise<{
  success: boolean;
  created: string[];
  existing: string[];
  errors: string[];
}> {
  const admin = createSupabaseAdmin();
  const created: string[] = [];
  const existing: string[] = [];
  const errors: string[] = [];

  for (const bucket of BUCKETS) {
    try {
      const { data: buckets } = await admin.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === bucket.name);

      if (bucketExists) {
        existing.push(bucket.name);
        continue;
      }

      const { error } = await admin.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });

      if (error) {
        errors.push(`${bucket.name}: ${error.message}`);
      } else {
        created.push(bucket.name);
      }
    } catch (err) {
      errors.push(`${bucket.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return { success: errors.length === 0, created, existing, errors };
}

export async function getStorageBuckets(): Promise<
  Array<{ name: string; public: boolean; id: string }>
> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.storage.listBuckets();

  if (error) {
    console.error("Failed to list storage buckets:", error);
    return [];
  }

  return data.map((bucket) => ({
    name: bucket.name,
    public: bucket.public,
    id: bucket.id,
  }));
}
