// ======================================================
// Models/Bookmark.cs — 書籤的資料結構定義
// 負責：定義書籤有哪些欄位，EF Core 會依此建立資料表
// ======================================================

// Bookmark 是「資料模型（Model）」
// 這個 class 的每個屬性，對應到資料表裡的每一個「欄位」
public class Bookmark
{
    // Id 是主鍵，EF Core 看到叫做 Id 的屬性會自動設為主鍵
    // 資料庫會自動幫每筆資料產生唯一編號（1, 2, 3...）
    public int Id { get; set; }

    // 書籤標題，required 表示這個欄位不能是 null
    public required string Title { get; set; }

    // 書籤網址
    public required string Url { get; set; }

    // 備註，可以是 null（所以加了 ?）
    public string? Note { get; set; }

    // 建立時間，自動記錄這筆資料是什麼時候新增的
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 新增書籤時，前端傳來的資料格式（不含 Id 和 CreatedAt，這兩個由後端自動產生）
public class BookmarkInput
{
    public required string Title { get; set; }
    public required string Url { get; set; }
    public string? Note { get; set; }
}
