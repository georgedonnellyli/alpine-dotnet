using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using ModernMvcApp.Models;

namespace ModernMvcApp.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        var model = new DashboardViewModel
        {
            SalesData = [1500, 2300, 1800, 3900, 4200, 5400],
            Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        };
        return View(model);
    }

    [HttpGet]
    public IActionResult LoadFormData()
    {
        var data = new ContactFormData
        {
            Name = "Jane Smith",
            Email = "jane@example.com",
            Phone = "+1 (555) 987-6543",
            Category = "support",
            Questions =
            [
                new Question { Text = "What is your preferred contact time?", Answer = "Test 1"},
                new Question { Text = "How did you hear about us?" , Answer = "Test 2"},
                new Question { Text = "Any additional comments?", Answer = "Test 2 " }
            ]
        };
        return new JsonResult(data, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult SubmitForm([FromForm] FormSubmission model)
    {
        _logger.LogInformation("Form submitted: Name={Name} Email={Email} Category={Category}",
            model.Name, model.Email, model.Category);
        return Ok();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
