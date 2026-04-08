// ======================================================
// Program.cs — 後端程式的進入點
// 負責：設定資料庫連線、設定 CORS、定義所有 API 端點、啟動伺服器
// ======================================================
using Microsoft.EntityFrameworkCore;

// ===== 建立應用程式 =====
var builder = WebApplication.CreateBuilder(args);

// 註冊 AppDbContext，告訴 .NET 使用 PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 設定 CORS（跨來源資源共享）
// 允許前端（localhost:3000）存取後端 API
// 沒有這個設定，瀏覽器會基於安全考量，阻擋前端呼叫後端
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                  "http://localhost:3000",  // 本機開發
                  "https://jolly-water-034d40200.6.azurestaticapps.net" // Azure 前端
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// 套用 CORS 設定
app.UseCors("AllowFrontend");

// ===== API 端點定義 =====

// [0] 版本確認端點（用來測試 CI/CD 是否成功）
app.MapGet("/api/version", () => new { version = "v2", message = "CI/CD 自動部署成功！" });

// [1] 取得所有書籤
app.MapGet("/api/bookmarks", async (AppDbContext db) =>
{
    // 從資料庫讀取所有書籤，依建立時間倒序排列（最新的在最前面）
    return await db.Bookmarks.OrderByDescending(b => b.CreatedAt).ToListAsync();
});

// [2] 新增一個書籤
app.MapPost("/api/bookmarks", async (BookmarkInput input, AppDbContext db) =>
{
    // 建立新書籤物件
    var bookmark = new Bookmark
    {
        Title = input.Title,
        Url = input.Url,
        Note = input.Note
        // Id 和 CreatedAt 會自動產生
    };

    db.Bookmarks.Add(bookmark);  // 加進資料庫（還沒真正寫入）
    await db.SaveChangesAsync(); // 真正寫入資料庫

    return Results.Created($"/api/bookmarks/{bookmark.Id}", bookmark);
});

// [3] 刪除一個書籤
app.MapDelete("/api/bookmarks/{id}", async (int id, AppDbContext db) =>
{
    var bookmark = await db.Bookmarks.FindAsync(id); // 用 id 找書籤

    if (bookmark is null)
    {
        return Results.NotFound();
    }

    db.Bookmarks.Remove(bookmark); // 標記為刪除
    await db.SaveChangesAsync();   // 真正從資料庫刪除

    return Results.NoContent();
});

// ===== 啟動伺服器 =====
app.Run();
