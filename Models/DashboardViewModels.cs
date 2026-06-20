using Microsoft.AspNetCore.Html;

namespace ModernMvcApp.Models;

public class Question
{
    public string Text { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

public class ContactFormData
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public List<Question> Questions { get; set; } = [];
}

public class FormSubmission
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}

public class LookupOption
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}

public class FormComponentViewModel
{
    public string Title { get; set; } = "Contact Form";
    public string SubmitLabel { get; set; } = "Submit";
    public LookupOption[] LookupOptions { get; set; } = [];
    public string LookupLabel { get; set; } = "Category";
    public string LoadUrl { get; set; } = string.Empty;
    public string SubmitUrl { get; set; } = string.Empty;
    public IHtmlContent? Fields { get; set; }
}

public class DashboardViewModel
{
    public int[] SalesData { get; set; } = [];
    public string[] Months { get; set; } = [];
}

public class ChartComponentViewModel
{
    public string Title { get; set; } = string.Empty;
    public string ChartType { get; set; } = "line";
    public int[] Data { get; set; } = [];
    public string[] Labels { get; set; } = [];
}
