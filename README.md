# ModernMvcApp

An ASP.NET Core MVC dashboard demonstrating server-rendered Razor views with reactive client-side components using Alpine.js and Vite.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | .NET 8 |
| Web framework | ASP.NET Core MVC |
| Frontend bundler | Vite 5 |
| Reactivity | Alpine.js 3 |
| Charts | Chart.js 4 |
| Styling | Bootstrap 5 + SCSS |
| Vite integration | Vite.AspNetCore 2.4.1 |

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (LTS recommended)

### Running in Development

Two processes need to run in parallel:

```bash
# Terminal 1 — Vite dev server (hot module reload)
npm install
npm run dev

# Terminal 2 — ASP.NET Core
dotnet run
```

Vite.AspNetCore proxies asset requests from the .NET dev server to Vite automatically. Navigate to the URL printed by `dotnet run`.

### Production Build

```bash
npm run build
dotnet run
```

Vite outputs to `wwwroot/dist`. The .NET app serves those static files directly in production mode.

## Project Structure

```
ModernMvcApp/
├── Controllers/
│   └── HomeController.cs          # Index, LoadFormData (GET), SubmitForm (POST)
├── Models/
│   └── DashboardViewModels.cs     # All view models and data transfer types
├── Views/
│   ├── Home/
│   │   └── Index.cshtml           # Dashboard page
│   └── Shared/
│       ├── _Layout.cshtml         # Master layout, Vite asset tags
│       ├── _FormComponent.cshtml  # Form wrapper (card, Alpine scope, success banner)
│       ├── _FormFields.cshtml     # Form inputs — injected into _FormComponent as IHtmlContent
│       └── _ChartComponent.cshtml # Reusable Chart.js card
└── FrontEnd/
    ├── main.js                    # Alpine components: formComponent, setupChart
    ├── site.scss                  # Global styles
    └── package.json
```

## Key Patterns

### Form Component

`_FormComponent` owns the Alpine `x-data` scope. The actual inputs live in `_FormFields` and are passed in as `FormComponentViewModel.Fields` (`IHtmlContent`), so the caller (`Index.cshtml`) controls what fields appear:

```razor
@{
    var formModel = new FormComponentViewModel { ... };
    formModel.Fields = await Html.PartialAsync("_FormFields", formModel);
}
@await Html.PartialAsync("_FormComponent", formModel)
```

### Dynamic Field Discovery

`formComponent` in `main.js` scans its DOM on `init()` for any `[x-model^="fields."]` elements and bootstrads `fields`, `touched`, and `errors` from those — no field names are hardcoded in the JS. Adding a new input to `_FormFields` with `x-model="fields.myField" required` is enough for it to be validated and submitted automatically.

### Chart Component

Pass data entirely from the server via the partial model:

```razor
<partial name="_ChartComponent" model='new ChartComponentViewModel {
    Title = "My Chart",
    ChartType = "bar",
    Data = new int[] { 1, 2, 3 },
    Labels = new string[] { "A", "B", "C" }
}' />
```

### JSON Serialization in Razor

`IJsonHelper.Serialize` returns `IHtmlContent` and bypasses Razor's HTML encoder, which breaks HTML attributes that use double quotes. Use `data-*` attributes with a plain `string` serialization instead:

```razor
@{
    var json = System.Text.Json.JsonSerializer.Serialize(Model.Data,
        new System.Text.Json.JsonSerializerOptions {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        });
}
<div data-options="@json" x-data="myComponent(JSON.parse($el.dataset.options))">
```
