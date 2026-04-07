// ======================================================
// Data/AppDbContext.cs — 資料庫連線的核心設定
// 負責：告訴 EF Core 資料庫裡有哪些資料表，作為程式和資料庫之間的橋樑
// ======================================================
using Microsoft.EntityFrameworkCore;

// AppDbContext 是 EF Core 的核心類別
// 它代表「資料庫的連線」，同時告訴 EF Core 資料庫裡有哪些資料表
public class AppDbContext : DbContext
{
    // 這個建構子是固定寫法，讓 .NET 能自動注入設定
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // DbSet 代表資料庫裡的一張「資料表」
    // EF Core 會自動建立一張叫做 "Bookmarks" 的資料表
    public DbSet<Bookmark> Bookmarks { get; set; }
}
