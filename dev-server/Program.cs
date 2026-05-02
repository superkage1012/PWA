using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();
var rootPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, ".."));
var fileProvider = new PhysicalFileProvider(rootPath);

app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = fileProvider
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = fileProvider
});

app.Run();
