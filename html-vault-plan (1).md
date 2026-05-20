# HTML 文档仓库 — 项目总索引

**版本**：v1.0  
**日期**：2026-05-20  
**状态**：草稿

---

## 文档导航

本项目的需求、设计和技术文档已拆分为独立的文件，便于维护和查阅：

| 文档 | 文件 | 说明 |
|------|------|------|
| 📋 **PRD — 产品需求文档** | [`prd.md`](./prd.md) | 背景目标、功能需求、非功能需求、界面设计规范 |
| 🎨 **UI 设计文档** | [`ui-design.md`](./ui-design.md) | 设计原则、视觉风格、页面布局、组件设计、动效规范、响应式断点、可访问性 |
| 🔧 **TDD — 技术设计文档** | [`tdd.md`](./tdd.md) | 技术选型、系统架构、关键技术实现、数据结构设计、IndexedDB 存储方案、风险应对 |

---

## 项目概述

纯前端、无需后端的 HTML 文件管理工具。将本地上传的 HTML 文档持久存储在浏览器 IndexedDB 中，通过白色毛玻璃风格的卡片界面进行统一管理。所有数据存储在本地，无隐私泄露风险。

**核心目标：**
- 单文件 HTML 应用，零依赖部署
- 所有数据本地持久化（IndexedDB）
- 每个文档自动分配全局唯一 UUID
- 点击文档在新标签页直接渲染 HTML 内容
// 示例输出：'550e8400-e29b-41d4-a716-446655440000'
```

#### 2.3.3 IndexedDB 操作封装

所有 DB 操作封装为 Promise，避免回调地狱：

```javascript
function dbRequest(mode, operation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('docs', mode);
    const store = tx.objectStore('docs');
    const req = operation(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const getAll  = () => dbRequest('readonly',  s => s.getAll());
const put     = doc => dbRequest('readwrite', s => s.put(doc));
const remove  = id  => dbRequest('readwrite', s => s.delete(id));
```

---

## 四、数据结构设计 {#data-schema}

### 3.1 文档对象（Doc）

```typescript
interface Doc {
  uuid: string;          // UUID v4，主键，示例："550e8400-e29b-41d4-a716-446655440000"
  name: string;          // 显示名称（可重命名），默认取文件名去掉扩展名
  filename: string;      // 原始文件名，含扩展名，示例："index.html"
  content: string;       // HTML 文件完整内容（字符串）
  size: number;          // 文件大小，单位 bytes
  uploadedAt: number;    // 上传时间戳（Unix ms），示例：1716192000000
  tags: string[];        // 标签列表，示例：["项目A", "原型"]
}
```

### 3.2 IndexedDB Schema

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

### 3.3 内存状态（Runtime State）

```javascript
// 运行时状态（不持久化，每次从 DB 加载）
let db = null;           // IDBDatabase 实例
let allDocs = [];        // 全量文档数组（从 DB 加载后缓存）
let activeTag = null;    // 当前激活的标签过滤器，null = 全部
let allTags = new Set(); // 全量标签集合（从 allDocs 派生）
```

---

## 五、IndexedDB 存储方案详解 {#indexeddb}

### 4.1 数据库初始化流程

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

### 4.2 CRUD 操作说明

| 操作 | IndexedDB 方法 | 触发时机 |
|------|---------------|---------|
| 新增文档 | `store.put(doc)` | 上传文件后 |
| 读取全部 | `store.getAll()` | 应用启动、操作后刷新 |
| 更新文档 | `store.put(doc)` | 重命名、编辑标签 |
| 删除文档 | `store.delete(uuid)` | 点击删除按钮确认后 |

> `put()` 在 IndexedDB 中具有 upsert 语义：主键存在则更新，不存在则插入。

### 4.3 存储容量估算

| 场景 | 单文件大小 | 文档数量 | 总存储 |
|------|-----------|---------|--------|
| 轻度使用 | 50 KB | 50 | ~2.5 MB |
| 中度使用 | 200 KB | 200 | ~40 MB |
| 重度使用 | 500 KB | 500 | ~250 MB |

浏览器 IndexedDB 配额通常为磁盘空间的 50%~80%，实际使用无需担心。

### 4.4 版本升级策略

当前 v1，若未来新增字段（如 `description`、`updatedAt`），通过 `onupgradeneeded` 迁移：

```javascript
request.onupgradeneeded = (e) => {
  const db = e.target.result;
  const oldVersion = e.oldVersion;

  if (oldVersion < 1) {
    db.createObjectStore('docs', { keyPath: 'uuid' });
  }
  if (oldVersion < 2) {
    // 未来版本：添加新索引或迁移字段
    const store = e.target.transaction.objectStore('docs');
    store.createIndex('by_uploadedAt', 'uploadedAt', { unique: false });
  }
};
```

---

## 六、开发任务拆解 {#tasks}

### 5.1 里程碑规划

```
M1 — 核心存储与展示（2天）
  ├─ IndexedDB 初始化与 CRUD 封装
  ├─ 文档上传（文件读取 + UUID 生成 + 存储）
  └─ 文档卡片网格渲染

M2 — 预览与管理（1天）
  ├─ Blob URL 新标签页预览
  ├─ 删除（含确认）
  └─ 重命名

M3 — 搜索、标签、UI 打磨（1天）
  ├─ 实时搜索过滤
  ├─ 标签 CRUD 与过滤
  └─ 毛玻璃样式、动效、响应式
```

### 5.2 详细任务列表

| 编号 | 任务 | 里程碑 | 预估工时 |
|------|------|--------|---------|
| T01 | IndexedDB 初始化与 Promise 封装 | M1 | 2h |
| T02 | 文件上传：FileReader + UUID + put() | M1 | 2h |
| T03 | 文档列表：getAll + 卡片渲染 | M1 | 3h |
| T04 | Blob URL 打开新标签页 | M2 | 1h |
| T05 | 删除文档（confirm + delete） | M2 | 1h |
| T06 | 重命名弹窗（Modal + put()） | M2 | 2h |
| T07 | 搜索框实时过滤（内存过滤，不查 DB） | M3 | 1h |
| T08 | 标签编辑弹窗（增删标签 + 颜色映射） | M3 | 3h |
| T09 | 标签过滤栏（点击切换激活标签） | M3 | 1h |
| T10 | 毛玻璃 CSS 样式、hover 动效 | M3 | 2h |
| T11 | 拖拽上传区域（dragover + drop） | M3 | 1.5h |
| T12 | 弹窗拦截提示（window.open 失败处理） | M3 | 0.5h |

**总预估：约 20 工时（2.5 个工作日）**

### 5.3 风险与注意事项

| 风险 | 描述 | 应对方案 |
|------|------|---------|
| 弹窗被浏览器拦截 | `window.open` 在某些场景下会被阻止 | 检测返回值为 null 时，展示提示引导用户允许弹窗 |
| 相对路径资源无法加载 | Blob URL 渲染时，HTML 内的相对路径 src/href 失效 | 文档内提示，建议上传使用绝对路径或内联资源的 HTML |
| 大文件性能 | 存储 >5MB 的 HTML 时读写变慢 | 上传时提示文件大小，超过 5MB 弹出警告 |
| IndexedDB 在无痕模式 | 部分浏览器无痕模式下 IndexedDB 有限制 | 检测初始化失败时给出友好提示 |

---

*文档由 Claude 生成，供开发参考。如有功能调整，以实际需求为准。*
