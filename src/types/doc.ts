export interface Doc {
  uuid: string; // UUID v4，主键
  name: string; // 显示名称
  filename: string; // 原始文件名
  content: string; // HTML 内容
  size: number; // 大小 (bytes)
  uploadedAt: number; // 上传时间戳
  tags: string[]; // 标签列表
}

export type NewDoc = Omit<Doc, "uuid" | "uploadedAt" | "tags">;
