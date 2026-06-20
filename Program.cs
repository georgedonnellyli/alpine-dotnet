using Vite.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddViteServices(options => {
    // Tells .NET to automatically execute "npm run dev" in the background
    options.Server.AutoRun = true; 
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// 2. USE VITE MIDDLEWARE IN DEVELOPMENT
if (app.Environment.IsDevelopment())
{
    app.UseWebSockets(); // Required for HMR
    app.UseViteDevelopmentServer(); // Proxies requests to Vite
}

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
