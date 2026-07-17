import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { PrivateObjectStore } from "./private-object-store";
import { createLocalPrivateObjectStore } from "./local-private-object-store";

type S3PrivateObjectStoreOptions = {
  bucket: string;
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function createS3PrivateObjectStore(
  options: S3PrivateObjectStoreOptions,
): PrivateObjectStore {
  const client = new S3Client({
    endpoint: options.endpoint,
    region: options.region,
    forcePathStyle: Boolean(options.endpoint),
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    },
  });

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: options.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    },

    async get(key) {
      const result = await client.send(
        new GetObjectCommand({ Bucket: options.bucket, Key: key }),
      );
      if (!result.Body) throw new Error("PDF 文件内容不存在");
      return result.Body.transformToByteArray();
    },

    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: options.bucket, Key: key }));
    },

    createPreviewUrl(key, expiresInSeconds = 300) {
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: options.bucket, Key: key }),
        { expiresIn: Math.min(300, Math.max(30, expiresInSeconds)) },
      );
    },
  };
}

export function createConfiguredPrivateObjectStore() {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    if (process.env.NODE_ENV !== "production") return createLocalPrivateObjectStore();
    throw new Error("私有文件存储尚未配置");
  }

  return createS3PrivateObjectStore({
    bucket,
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "auto",
    accessKeyId,
    secretAccessKey,
  });
}
