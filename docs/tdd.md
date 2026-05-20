# HTML 文档仓库 — 技术设计文档 (TDD)

**版本**：v1.0  
**日期**：2026-05-20  
**状态**：草稿

---

## 1. 技术选型

| 层级      | 选型                       | 理由                                  |
| --------- | -------------------------- | ------------------------------------- |
| 应用形态  | React SPA (Vite + TS)      | 组件化开发，强类型约束，高性能渲染    |
| 持久存储  | IndexedDB (idb 库)         | 异步 Promise 封装，操作简洁           |
| 样式      | Tailwind CSS / CSS Modules | 高效实现毛玻璃与响应式布局            |
| UUID 生成 | `crypto.randomUUID()`      | 浏览器原生，无需库，符合 UUID v4 规范 |
| HTML 渲染 | Blob URL + `window.open`   | 无需服务器，安全沙箱渲染              |

---

## 2. 系统架构

```
┌─────────────────────────────────────────────┐
│             React UI Components              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Navigation│ │ TagFilter│ │ DocumentGrid │ │
│  │ (Search)  │ │ (Logic)   │ │ (Cards)      │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
└─────────────────────┬───────────────────────┘
                      │ Use Hooks/Context
┌─────────────────────▼───────────────────────┐
│               Service Layer                  │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐ │
│  │  DBService  │  │ DocState │  │ Utils    │ │
│  │ (idb wrapper)│  │ (React)  │  │ (Blob/UUID)│ │
│  └─────┬──────┘  └──────────┘  └──────────┘ │
└────────┼────────────────────────────────────┘
         │ async/await
┌────────▼────────────────────────────────────┐
│              IndexedDB                       │
│   Database: htmlVault  |  ObjectStore: docs  │
└─────────────────────────────────────────────┘
```

---

## 3. 关键技术实现

### 3.1 新标签页渲染 HTML

由于 IndexedDB 中存的是 HTML 字符串，无法直接用 URL 访问。使用 Blob URL 方案：

```javascript
function openDoc(uuid) {
  const doc = allDocs.find((d) => d.uuid === uuid);
  const blob = new Blob([doc.content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, "_blank");
  // Blob URL 在标签页加载完成后自动失效，安全无副作用
  // 注意：部分浏览器会拦截 window.open，需用户手动允许弹窗
  tab?.addEventListener("load", () => URL.revokeObjectURL(url));
}
```

**注意事项：**

- Blob URL 是临时的，页面关闭后自动释放
- 若浏览器拦截弹窗，需提示用户允许该网站弹出窗口
- HTML 内的相对路径资源（图片、CSS、JS）无法加载，这是纯前端方案的固有限制

### 3.2 UUID 生成

```javascript
// 使用浏览器原生 API，符合 RFC 4122 UUID v4
const uuid = crypto.randomUUID();
// 示例输出：'550e8400-e29b-41d4-a716-446655440000'
```

### 3.3 IndexedDB 操作封装

所有 DB 操作封装为 Promise，避免回调地狱：

```javascript
function dbRequest(mode, operation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("docs", mode);
    const store = tx.objectStore("docs");
    const req = operation(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const getAll = () => dbRequest("readonly", (s) => s.getAll());
const put = (doc) => dbRequest("readwrite", (s) => s.put(doc));
const remove = (id) => dbRequest("readwrite", (s) => s.delete(id));
```

---

## 4. 数据结构设计

### 4.1 文档对象（Doc）

```typescript
interface Doc {
  uuid: string; // UUID v4，主键，示例："550e8400-e29b-41d4-a716-446655440000"
  name: string; // 显示名称（可重命名），默认取文件名去掉扩展名
  filename: string; // 原始文件名，含扩展名，示例："index.html"
  content: string; // HTML 文件完整内容（字符串）
  size: number; // 文件大小，单位 bytes
  uploadedAt: number; // 上传时间戳（Unix ms），示例：1716192000000
  tags: string[]; // 标签列表，示例：["项目A", "原型"]
}
```

### 4.2 IndexedDB Schema

```
Database name : htmlVault
Database version : 1

ObjectStore : docs
  keyPath    : uuid
  autoIncrement : false

Indexes（可选扩展）:
  by_uploadedAt  → uploadedAt  （用于排序查询）
  by_name        → name        （用于全文检索扩展）
```

### 4.3 内存状态（Runtime State）

```javascript
// 运行时状态（不持久化，每次从 DB 加载）
let db = null; // IDBDatabase 实例
let allDocs = []; // 全量文档数组（从 DB 加载后缓存）
let activeTag = null; // 当前激活的标签过滤器，null = 全部
let allTags = new Set(); // 全量标签集合（从 allDocs 派生）
```

---

## 5. IndexedDB 存储方案详解

### 5.1 数据库初始化流程

```
应用启动
   │
   ▼
indexedDB.open('htmlVault', 1)
   │
   ├─ onupgradeneeded（首次 / 版本升级）
   │      └─ createObjectStore('docs', { keyPath: 'uuid' })
   │
   └─ onsuccess
          └─ 读取所有文档 → 渲染 UI
```

### 5.2 CRUD 操作说明

| 操作     | IndexedDB 方法       | 触发时机             |
| -------- | -------------------- | -------------------- |
| 新增文档 | `store.put(doc)`     | 上传文件后           |
| 读取全部 | `store.getAll()`     | 应用启动、操作后刷新 |
| 更新文档 | `store.put(doc)`     | 重命名、编辑标签     |
| 删除文档 | `store.delete(uuid)` | 点击删除按钮确认后   |

> `put()` 在 IndexedDB 中具有 upsert 语义：主键存在则更新，不存在则插入。

### 5.3 存储容量估算

| 场景     | 单文件大小 | 文档数量 | 总存储  |
| -------- | ---------- | -------- | ------- |
| 轻度使用 | 50 KB      | 50       | ~2.5 MB |
| 中度使用 | 200 KB     | 200      | ~40 MB  |
| 重度使用 | 500 KB     | 500      | ~250 MB |

浏览器 IndexedDB 配额通常为磁盘空间的 50%~80%，实际使用无需担心。

### 5.4 版本升级策略

当前 v1，若未来新增字段（如 `description`、`updatedAt`），通过 `onupgradeneeded` 迁移：

```javascript
request.onupgradeneeded = (e) => {
  const db = e.target.result;
  const oldVersion = e.oldVersion;

  if (oldVersion < 1) {
    db.createObjectStore("docs", { keyPath: "uuid" });
  }
  if (oldVersion < 2) {
    // 未来版本：添加新索引或迁移字段
    const store = e.target.transaction.objectStore("docs");
    store.createIndex("by_uploadedAt", "uploadedAt", { unique: false });
  }
};
```

---

## 6. 风险与注意事项

| 风险                 | 描述                                             | 应对方案                                          |
| -------------------- | ------------------------------------------------ | ------------------------------------------------- |
| 弹窗被浏览器拦截     | `window.open` 在某些场景下会被阻止               | 检测返回值为 null 时，展示提示引导用户允许弹窗    |
| 相对路径资源无法加载 | Blob URL 渲染时，HTML 内的相对路径 src/href 失效 | 文档内提示，建议上传使用绝对路径或内联资源的 HTML |
| 大文件性能           | 存储 >5MB 的 HTML 时读写变慢                     | 上传时提示文件大小，超过 5MB 弹出警告             |
| IndexedDB 在无痕模式 | 部分浏览器无痕模式下 IndexedDB 有限制            | 检测初始化失败时给出友好提示                      |
