import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PrivateObjectStore } from "./private-object-store";

export function createLocalPrivateObjectStore(
  root = path.resolve(process.cwd(), ".data", "private"),
): PrivateObjectStore {
  function resolveKey(key: string) {
    const target = path.resolve(root, key);
    if (!target.startsWith(`${root}${path.sep}`)) throw new Error("无效的私有文件路径");
    return target;
  }

  return {
    async put(key, body) {
      const target = resolveKey(key);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
    },
    async get(key) {
      return new Uint8Array(await readFile(resolveKey(key)));
    },
    async remove(key) {
      await rm(resolveKey(key), { force: true });
    },
    async createPreviewUrl() {
      throw new Error("本地文件通过受保护的预览接口读取");
    },
  };
}
