import { useState, useEffect, useMemo } from "react";
import "./App.css";
import type { Doc } from "./types/doc";
import { getAllDocs, putDoc, deleteDoc } from "./services/db";

function App() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [modalType, setModalType] = useState<"rename" | "tags" | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [newTagName, setNewTagName] = useState("");

  const loadDocs = async () => {
    try {
      const allDocs = await getAllDocs();
      setDocs(allDocs.sort((a, b) => b.uploadedAt - a.uploadedAt));
    } catch (err) {
      console.error("Failed to load docs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocs();
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    docs.forEach((doc) => doc.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [docs]);

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const name = doc.name || "";
      const matchesSearch = name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesTag = activeTag ? doc.tags.includes(activeTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [docs, searchQuery, activeTag]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) continue;
      if (file.size > 10 * 1024 * 1024) {
        if (
          !window.confirm(
            `文件 ${file.name} 超过 10MB，可能会由于 IndexedDB 限制导致性能下降。是否继续？`,
          )
        )
          continue;
      }

      const content = await file.text();
      const newDoc: Doc = {
        uuid: crypto.randomUUID(),
        name: file.name.replace(/\.html?$/, ""),
        filename: file.name,
        content,
        size: file.size,
        uploadedAt: Date.now(),
        tags: [],
      };

      await putDoc(newDoc);
    }
    loadDocs();
    e.target.value = "";
  };

  const handleDelete = async (uuid: string) => {
    if (window.confirm("确定要删除这个文档吗？")) {
      await deleteDoc(uuid);
      loadDocs();
    }
  };

  const handleRename = async () => {
    if (!editingDoc || !tempValue.trim()) return;
    const updatedDoc = { ...editingDoc, name: tempValue.trim() };
    await putDoc(updatedDoc);
    setEditingDoc(null);
    setModalType(null);
    loadDocs();
  };

  const toggleTag = async (tag: string) => {
    if (!editingDoc) return;
    const tags = editingDoc.tags.includes(tag)
      ? editingDoc.tags.filter((t) => t !== tag)
      : [...editingDoc.tags, tag];

    const updatedDoc = { ...editingDoc, tags };
    await putDoc(updatedDoc);
    setEditingDoc(updatedDoc);
    loadDocs();
  };

  const addNewTag = async () => {
    if (!editingDoc || !newTagName.trim()) return;
    if (editingDoc.tags.includes(newTagName.trim())) return;

    const tags = [...editingDoc.tags, newTagName.trim()];
    const updatedDoc = { ...editingDoc, tags };
    await putDoc(updatedDoc);
    setEditingDoc(updatedDoc);
    setNewTagName("");
    loadDocs();
  };

  const openDoc = (doc: Doc) => {
    const blob = new Blob([doc.content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      alert("弹窗被拦截，请允许本站弹出窗口以预览 HTML");
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="app-main">
      <header className="header">
        <div className="header-left">
          <h1>文档仓库</h1>
          <span className="doc-count">{docs.length} 个文档</span>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索文档名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="header-actions">
          <label className="upload-btn">
            ↑ 上传 HTML
            <input
              type="file"
              accept=".html,.htm"
              multiple
              hidden
              onChange={handleUpload}
            />
          </label>
        </div>
      </header>

      <nav className="tag-filter-bar">
        <button
          className={activeTag === null ? "active" : ""}
          onClick={() => setActiveTag(null)}
        >
          全部
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            className={activeTag === tag ? "active" : ""}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </nav>

      <main className="document-grid">
        {filteredDocs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <p>
              {docs.length === 0
                ? "还没有文档，点击「上传 HTML」开始"
                : "未找到匹配的文档"}
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.uuid}
              className="doc-card"
              onClick={() => openDoc(doc)}
            >
              <div className="card-preview">
                <div className="html-icon">HTML</div>
              </div>
              <div className="card-info">
                <h3 className="doc-name" title={doc.name}>
                  {doc.name}
                </h3>
                <div className="doc-meta">
                  <span>
                    📅 {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                  <span>⚖️ {(doc.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="doc-tags">
                  {doc.tags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="doc-uuid">{doc.uuid.substring(0, 18)}...</div>
              </div>
              <div
                className="card-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="action-btn"
                  onClick={() => {
                    setEditingDoc(doc);
                    setModalType("rename");
                    setTempValue(doc.name);
                  }}
                  title="重命名"
                >
                  ✏️
                </button>
                <button
                  className="action-btn"
                  onClick={() => {
                    setEditingDoc(doc);
                    setModalType("tags");
                  }}
                  title="管理标签"
                >
                  🏷️
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(doc.uuid)}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modals */}
      {editingDoc && modalType === "rename" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>重命名文档</h3>
            <div className="modal-input-group">
              <label>显示名称</label>
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditingDoc(null);
                  setModalType(null);
                }}
              >
                取消
              </button>
              <button className="btn-primary" onClick={handleRename}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {editingDoc && modalType === "tags" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>管理标签</h3>
            <div className="tag-edit-section">
              <p className="section-label">已有标签</p>
              <div className="tag-selection-grid">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-selection-item ${editingDoc.tags.includes(tag) ? "selected" : ""}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <p className="section-label">添加新标签</p>
              <div className="tag-input-row">
                <input
                  type="text"
                  placeholder="标签名称..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
                <button className="btn-primary" onClick={addNewTag}>
                  添加
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditingDoc(null);
                  setModalType(null);
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
