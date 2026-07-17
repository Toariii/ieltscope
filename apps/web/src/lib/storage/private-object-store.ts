export type PrivateObjectStore = {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  remove(key: string): Promise<void>;
  createPreviewUrl(key: string, expiresInSeconds?: number): Promise<string>;
};
