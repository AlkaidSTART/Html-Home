# HTML 文档仓库 — 项目计划文档

**版本**：v1.0  
**日期**：2026-05-20  
**状态**：草稿

---

## 目录

1. [PRD — 产品需求文档](#prd)
2. [UI 设计文档](#uidoc)
3. [TDD — 技术设计文档](#tdd)
4. [数据结构设计](#data-schema)
5. [存储方案（IndexedDB）](#indexeddb)
6. [开发任务拆解](#tasks)

---

## 一、PRD — 产品需求文档 {#prd}

### 1.1 背景与目标

用户需要一个纯前端、无需后端的 HTML 文件管理工具，能够将本地上传的 HTML 文档持久存储在浏览器中，并通过白色毛玻璃风格的界面进行统一管理。所有数据存储在本地浏览器 IndexedDB，无隐私泄露风险。

**核心目标：**
- 单文件 HTML 应用，零依赖部署
- 所有数据本地持久化（IndexedDB）
- 每个文档自动分配全局唯一 UUID
- 点击文档在新标签页直接渲染 HTML 内容

### 1.2 用户角色

| 角色 | 描述 |
|------|------|
| 文档管理者 | 上传、整理、查找自己的 HTML 文档 |

### 1.3 功能需求

#### F1 — 文档上传

| ID | 需求描述 | 优先级 |
|----|----------|--------|
| F1-1 | 支持点击按钮选择单个或多个 `.html` / `.htm` 文件上传 | P0 |
| F1-2 | 上传时自动生成 UUID v4，关联至该文档 | P0 |
| F1-3 | 支持拖拽文件到上传区域 | P1 |
| F1-4 | 上传后立即展示在文档列表，无需刷新 | P0 |

#### F2 — 文档列表展示

| ID | 需求描述 | 优先级 |
|----|----------|--------|
| F2-1 | 以卡片网格展示所有文档 | P0 |
| F2-2 | 卡片展示：文件名、上传时间、UUID（截断显示） | P0 |
| F2-3 | 卡片展示已绑定的标签 | P0 |
| F2-4 | 按上传时间倒序排列（最新在前） | P0 |

#### F3 — 文档预览

| ID | 需求描述 | 优先级 |
|----|----------|--------|
| F3-1 | 点击卡片，在新标签页直接渲染 HTML 内容 | P0 |
| F3-2 | 使用 Blob URL 从 IndexedDB 读取内容后动态渲染，无需服务器 | P0 |

#### F4 — 文档管理

| ID | 需求描述 | 优先级 |
|----|----------|--------|
| F4-1 | 支持删除文档（含确认提示） | P0 |
| F4-2 | 支持重命名文档（修改显示名，不影响原始文件名） | P0 |
| F4-3 | 支持为文档添加/移除标签 | P1 |
| F4-4 | 支持自定义新建标签 | P1 |

#### F5 — 搜索与过滤

| ID | 需求描述 | 优先级 |
|----|----------|--------|
| F5-1 | 支持按文件名实时搜索（输入即过滤） | P0 |
| F5-2 | 支持按标签过滤文档 | P1 |
| F5-3 | 搜索与标签过滤可同时生效（AND 逻辑） | P1 |

### 1.4 非功能需求

- **性能**：文档列表渲染 < 100ms（≤200 个文档）
- **存储**：单个 HTML 文件大小建议 < 5MB（IndexedDB 实际无硬限制，但过大影响读写速度）
- **兼容性**：支持 Chrome 90+、Firefox 90+、Edge 90+（均支持 IndexedDB v2）
- **安全**：所有数据存储在本地，不发起任何网络请求

### 1.5 界面设计规范

- **主题**：白色毛玻璃（Frosted Glass），背景带轻微渐变
- **卡片**：`backdrop-filter: blur`，白色半透明背景，细边框
- **动效**：卡片 hover 上浮 2px，操作按钮 hover 渐显
- **布局**：响应式网格，最小卡片宽度 220px

---

## 二、UI 设计文档 {#uidoc}

### 2.1 设计原则

| 原则 | 说明 |
|------|------|
| 轻盈通透 | 毛玻璃质感传达「内容在前、界面退后」的层次感 |
| 克制留白 | 卡片间距充裕，避免拥挤，让文档本身成为视觉主体 |
| 即时反馈 | 每一次交互（hover、点击、上传）都有轻微动效响应 |
| 零学习成本 | 操作按钮在悬停时出现，保持界面整洁不冗余 |

---

### 2.2 视觉风格

#### 色彩体系

| 角色 | 色值 | 用途 |
|------|------|------|
| 页面背景 | `linear-gradient(135deg, #f0f4ff → #fafafa → #f5f0ff)` | 整体底色，冷暖交融的淡渐变 |
| 卡片表面 | `rgba(255, 255, 255, 0.72)` | 半透明白，毛玻璃主角 |
| 卡片边框 | `rgba(255, 255, 255, 0.90)` | 高光边，增强玻璃质感 |
| 主操作按钮 | `#111827`（近黑） | 上传按钮，与白色背景强对比 |
| 文字主色 | `#111827` | 文件名、标题 |
| 文字辅色 | `#6B7280` | 日期、UUID、占位符 |
| 危险操作 | `#E53935` | 删除按钮 hover 状态 |
| 标签色板 | 8组预设色对（背景+文字）| 每个标签自动映射一组，详见下方 |

**标签色板（8组，循环分配）：**

```
1. 蓝色   bg #e8f0fe  text #1a73e8
2. 绿色   bg #e6f4ea  text #137333
3. 琥珀色  bg #fff8e1  text #e37400
4. 玫红色  bg #fce4ec  text #c62828
5. 靛蓝色  bg #e8eaf6  text #3949ab
6. 青色   bg #e0f2f1  text #00695c
7. 紫色   bg #f3e5f5  text #7b1fa2
8. 橙红色  bg #fbe9e7  text #bf360c
```

#### 字体

| 层级 | 字号 | 字重 | 场景 |
|------|------|------|------|
| 页面标题 | 20px | 500 | 「文档仓库」主标题 |
| 卡片文件名 | 13px | 500 | 文档名称 |
| 卡片元信息 | 11px | 400 | 上传日期 |
| UUID 行 | 10px | 400 | mono 字体，低透明度 |
| 标签文字 | 10~12px | 400 | 标签 pill |
| 输入框 / 按钮 | 13px | 400 | 工具栏元素 |

#### 圆角

| 元素 | 圆角值 |
|------|--------|
| 文档卡片 | 12px |
| 输入框、按钮 | 8px |
| 标签 pill | 20px（全圆） |
| 小操作按钮 | 6px |
| 弹窗 Modal | 12px |

#### 模糊与透明

```css
/* 卡片毛玻璃效果 */
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 0.5px solid rgba(255, 255, 255, 0.90);

/* 弹窗遮罩 */
background: rgba(0, 0, 0, 0.18);
```

---

### 2.3 页面布局

```
┌──────────────────────────────────────────────────────┐
│  HEADER BAR                                          │
│  [文档仓库  N个文档]  [🔍 搜索框............]  [↑上传] │
├──────────────────────────────────────────────────────┤
│  TAG FILTER BAR                                      │
│  [全部●] [项目A] [原型] [参考] ...                    │
├──────────────────────────────────────────────────────┤
│  DOCUMENT GRID  (auto-fill, min 220px per card)      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  预览区   │  │  预览区   │  │  预览区   │           │
│  │  (图标)  │  │  (图标)  │  │  (图标)  │           │
│  ├──────────┤  ├──────────┤  ├──────────┤           │
│  │ 文件名    │  │ 文件名    │  │ 文件名    │           │
│  │ 日期      │  │ 日期      │  │ 日期      │           │
│  │[标签][标签]│  │[标签]     │  │          │           │
│  │ uuid...  │  │ uuid...  │  │ uuid...  │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                      │
│  （空状态）上传第一个 HTML 文档开始使用                  │
└──────────────────────────────────────────────────────┘
```

**网格规则：**
- `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`
- 卡片间距：`gap: 14px`
- 页面内边距：`padding: 24px`

---

### 2.4 组件设计

#### 文档卡片

```
┌─────────────────────────┐  ← border-radius: 12px
│                         │     background: rgba(255,255,255,0.72)
│   [HTML 文件图标 36px]   │  ← 预览区高度 110px，背景 #f8faff→#eef2ff
│                         │
├─────────────────────────┤  ← border-bottom: 0.5px
│  文件显示名称             │  ← 13px/500，超长省略号
│  📅 2026/05/20          │  ← 11px，灰色
│  [标签A] [标签B]         │  ← pill，10px
│                         │
│  550e8400-e29b-41d4...  │  ← 10px mono，opacity 0.6
└─────────────────────────┘

Hover 状态：
  - transform: translateY(-2px)
  - box-shadow: 0 4px 24px rgba(0,0,0,0.08)
  - 右上角操作按钮组渐显（display: flex）

操作按钮组（hover 显示）：
  [ ✏️ 重命名 ]  [ 🏷️ 标签 ]  [ 🗑️ 删除 ]
  26×26px，圆角6px，毛玻璃背景
```

#### 工具栏

```
左侧：
  「文档仓库」标题（20px/500）+ 文档数量角标（12px/灰）

中间：
  搜索框（flex: 1，左内嵌搜索图标，placeholder: 搜索文档名称…）

右侧：
  「↑ 上传 HTML」按钮
  → 近黑底色，白色文字，13px，padding: 7px 14px
  → hover: opacity 0.85
```

#### 标签过滤栏

```
[全部]  [标签名]  [标签名]  ...

激活态：背景色 = 该标签对应的 text 色，文字白色
未激活：透明背景，text 色文字，淡色边框
```

#### 重命名弹窗

```
┌──────────────────────────────┐
│  重命名文档                   │  ← 15px/500
│                              │
│  显示名称                     │  ← label 12px 灰
│  [________________________]  │  ← input
│                              │
│              [取消] [保存]    │
└──────────────────────────────┘
遮罩：rgba(0,0,0,0.18)，覆盖整个应用区域
```

#### 标签编辑弹窗

```
┌──────────────────────────────┐
│  编辑标签                     │
│                              │
│  选择已有标签：               │
│  [标签A●] [标签B] [标签C]     │  ← 已选中 = 深色背景
│                              │
│  新建标签：                   │
│  [输入标签名________] [添加]  │
│                              │
│              [取消] [保存]   │
└──────────────────────────────┘
```

#### 空状态

```
         [ 文件夹图标 48px，浅灰 ]

     还没有文档，点击「上传 HTML」开始
              ( 14px，灰色 )
```

---

### 2.5 动效规范

| 元素 | 动效 | 时长 / 缓动 |
|------|------|------------|
| 卡片 hover | translateY(-2px) + shadow 渐现 | 150ms ease |
| 操作按钮组 | opacity 0→1（display: flex） | 150ms ease |
| 标签 pill 点击 | background / color 切换 | 150ms ease |
| 弹窗出现 | 无动画（直接显示，保持轻量） | — |
| 上传按钮 hover | opacity → 0.85 | 150ms ease |
| 删除按钮 hover | color → #E53935 | 150ms ease |

---

### 2.6 响应式断点

| 断点 | 卡片列数 | 说明 |
|------|---------|------|
| ≥ 1200px | 4~5 列 | 宽屏，auto-fill 自动计算 |
| 900~1199px | 3~4 列 | 标准桌面 |
| 600~899px | 2~3 列 | 小窗口 / 平板 |
| < 600px | 1~2 列 | 移动端，最小宽度 220px 保证可读 |

工具栏在窄屏（< 480px）时搜索框独占一行，按钮自动换行。

---

### 2.7 可访问性

- 所有图标按钮提供 `aria-label`
- 操作按钮组在键盘 Tab 聚焦卡片时同样显示
- 搜索框有明确 `placeholder` 文案
- 删除操作需二次确认，防止误操作
- 颜色对比度：正文与背景满足 WCAG AA（对比度 ≥ 4.5:1）

---

## 三、TDD — 技术设计文档 {#tdd}

### 2.1 技术选型

| 层级 | 选型 | 理由 |
|------|------|------|
| 应用形态 | 单文件 HTML（Vanilla JS） | 零依赖，双击即可使用，无需构建 |
| 持久存储 | IndexedDB（原生） | 浏览器原生支持，存储量大，支持二进制/文本 |
| 样式 | 纯 CSS + backdrop-filter | 毛玻璃效果无需框架 |
| UUID 生成 | `crypto.randomUUID()` | 浏览器原生，无需库，符合 UUID v4 规范 |
| HTML 渲染 | Blob URL + `window.open` | 无需服务器，安全沙箱渲染 |

### 2.2 系统架构

```
┌─────────────────────────────────────────────┐
│                  UI Layer                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ 工具栏    │ │ 标签栏    │ │   文档网格    │ │
│  │ 搜索/上传 │ │ 过滤器    │ │   卡片列表   │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
└─────────────────────┬───────────────────────┘
                      │ 调用
┌─────────────────────▼───────────────────────┐
│               Service Layer                  │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐ │
│  │  DBService  │  │ DocStore │  │ UIRender │ │
│  │ CRUD 封装   │  │ 内存缓存  │  │ 渲染引擎  │ │
│  └─────┬──────┘  └──────────┘  └──────────┘ │
└────────┼────────────────────────────────────┘
         │ 读写
┌────────▼────────────────────────────────────┐
│              IndexedDB                       │
│   Database: htmlVault  |  ObjectStore: docs  │
└─────────────────────────────────────────────┘
```

### 2.3 关键技术实现

#### 2.3.1 新标签页渲染 HTML

由于 IndexedDB 中存的是 HTML 字符串，无法直接用 URL 访问。使用 Blob URL 方案：

```javascript
function openDoc(uuid) {
  const doc = allDocs.find(d => d.uuid === uuid);
  const blob = new Blob([doc.content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, '_blank');
  // Blob URL 在标签页加载完成后自动失效，安全无副作用
  // 注意：部分浏览器会拦截 window.open，需用户手动允许弹窗
  tab?.addEventListener('load', () => URL.revokeObjectURL(url));
}
```

**注意事项：**
- Blob URL 是临时的，页面关闭后自动释放
- 若浏览器拦截弹窗，需提示用户允许该网站弹出窗口
- HTML 内的相对路径资源（图片、CSS、JS）无法加载，这是纯前端方案的固有限制

#### 2.3.2 UUID 生成

```javascript
// 使用浏览器原生 API，符合 RFC 4122 UUID v4
const uuid = crypto.randomUUID();
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
