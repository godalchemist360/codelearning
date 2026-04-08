// ======================================================
// app/page.tsx — 網站首頁（對應網址 /）
// 負責：顯示書籤清單、新增書籤表單、刪除功能，並串接後端 API
// ======================================================
"use client";

import { useState, useEffect } from "react";
// TODO: 未來在這裡加入搜尋功能

type Bookmark = {
  id: number;
  title: string;
  url: string;
  note: string | null;
  createdAt: string;
};

// 後端 API 的網址
// 本機開發時用 localhost，部署後改成 Azure 的網址
const API_URL = "https://bookmark-api-app.azurewebsites.net/api/bookmarks";

export default function Home() {

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);        // 是否正在從後端載入書籤清單
  const [submitting, setSubmitting] = useState(false);  // 是否正在送出新增請求
  const [error, setError] = useState<string | null>(null); // 錯誤訊息，null 代表沒有錯誤

  // useEffect：頁面第一次載入時，自動執行一次 fetchBookmarks
  // [] 代表「只在第一次載入時執行」，不會每次渲染都執行
  useEffect(() => {
    fetchBookmarks();
  }, []);

  // 從後端取得所有書籤
  async function fetchBookmarks() {
    setLoading(true);
    setError(null); // 每次重新載入時，先清除舊的錯誤訊息
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setBookmarks(data);
    } catch {
      // 連線失敗時（例如後端沒有啟動），catch 會捕捉到錯誤
      setError("無法連線到伺服器，請確認後端是否已啟動");
    }
    setLoading(false);
  }

  // 新增書籤
  async function handleAdd() {
    if (!title || !url) return;
    if (submitting) return; // 如果正在送出中，不允許重複點擊

    setSubmitting(true); // 開始送出，按鈕進入載入狀態
await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, note: note || null }),
    });

    setTitle("");
    setUrl("");
    setNote("");
    setSubmitting(false); // 送出完成，按鈕恢復正常

    fetchBookmarks();
  }

  // 刪除書籤
  async function handleDelete(id: number) {
    // 發送 DELETE 請求
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchBookmarks(); // 重新載入清單
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">書籤筆記 🚀 CI/CD 測試版</h1>

      {/* 新增書籤表單 */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-3">新增書籤</h2>

        <input
          className="w-full border rounded p-2 mb-2"
          placeholder="標題（必填）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full border rounded p-2 mb-2"
          placeholder="網址（必填）"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="w-full border rounded p-2 mb-2"
          placeholder="備註（選填）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAdd}
          disabled={submitting} // 送出中時按鈕變灰、不可點擊
        >
          {submitting ? "新增中..." : "新增"} {/* 根據狀態顯示不同文字 */}
        </button>
      </div>

      {/* 書籤清單 */}
      <div>
        <h2 className="font-semibold mb-3">所有書籤</h2>

        {/* 載入中 */}
        {loading && <p className="text-gray-400">載入中...</p>}

        {/* 錯誤訊息 */}
        {error && <p className="text-red-500">{error}</p>}

        {/* 沒有書籤（沒有錯誤的情況下才顯示） */}
        {!loading && !error && bookmarks.length === 0 && (
          <p className="text-gray-400">還沒有書籤，新增一個吧！</p>
        )}

        {/* 書籤清單 */}
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className="border rounded p-4 mb-3">

            <a
              href={bookmark.url}
              target="_blank"
              className="text-blue-500 font-medium hover:underline"
            >
              {bookmark.title}
            </a>

            {bookmark.note && (
              <p className="text-gray-600 text-sm mt-1">{bookmark.note}</p>
            )}

            <div className="flex justify-between items-center mt-2">
              <p className="text-gray-400 text-xs">
                {new Date(bookmark.createdAt).toLocaleString("zh-TW")}
              </p>
              <button
                className="text-red-400 text-sm hover:text-red-600"
                onClick={() => handleDelete(bookmark.id)}
              >
                刪除
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
