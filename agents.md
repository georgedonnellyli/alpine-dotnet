# Agent Guide — ModernMvcApp

Guidance for AI agents working on this codebase. Read this before making changes.

## Architecture at a Glance

Server-rendered Razor views with Alpine.js for client-side reactivity. There is no SPA router. Pages are full Razor views; interactive islands use `x-data` components defined in `FrontEnd/main.ts`.

- **No jQuery.** Use Alpine.js for DOM reactivity and `fetch` for AJAX.
- **No server-side form POST/redirect.** Forms submit via `fetch` and show inline success/error states.
- **No `asp-for` / ModelState validation.** Client-side validation is driven by HTML attributes (`required`, `type`) discovered dynamically by `formComponent`.

## File Responsibilities

| File | Purpose |
|---|---|
| `Controllers/HomeController.cs` | Actions only — no business logic. GET actions return view models or JSON; POST actions receive `[FromForm]` models. |
| `Models/DashboardViewModels.cs` | All view models, DTOs, and lookup types. One file for now; split if it grows large. |
| `Views/Shared/_FormComponent.cshtml` | Form shell: card wrapper, Alpine `x-data` scope, success banner, `<form>` tag. Does not define inputs. |
| `Views/Shared/_FormFields.cshtml` | Default input set. Passed into `_FormComponent` as `IHtmlContent Fields` from the calling view. |
| `Views/Shared/_ChartComponent.cshtml` | Self-contained Chart.js card. Receives all data through its model. |
| `FrontEnd/main.ts` | All Alpine component factories (`formComponent`, `setupChart`). Registered via `Alpine.data()` before `Alpine.start()`. |
| `FrontEnd/env.d.ts` | Vite client type reference — provides the `.scss` module shim so TypeScript doesn't error on the side-effect import. |
| `tsconfig.json` | TypeScript config. `moduleResolution: "bundler"` is required for Vite. Vite uses esbuild to compile TS, so `tsc` is type-check only (`npx tsc --noEmit`). |

## Alpine.js / TypeScript Conventions

### Registering components

All Alpine components are registered in `main.ts` via `Alpine.data()` before `Alpine.start()`:

```typescript
Alpine.data('myComponent', (arg: MyArgType) => ({
    // component data and methods
}));
```

Used in Razor as `x-data="myComponent(arg)"`. Do **not** use `window.myComponent = function(...)` — `Alpine.data()` keeps factories off `window` and integrates better with TypeScript.

### Typing Alpine magic properties

Alpine injects `$el`, `$refs`, and `$watch` at runtime via its reactive proxy — TypeScript cannot see them automatically. Use the `AlpineMagics` interface defined in `main.ts` and declare `this` explicitly on any method that needs them:

```typescript
interface AlpineMagics {
    $el: HTMLElement;
    $refs: Record<string, HTMLElement>;
    $watch(property: string, callback: () => void): void;
}

Alpine.data('myComponent', () => ({
    init(this: MyData & AlpineMagics) {
        this.$el.querySelector('...');  // typed
    }
}));
```

Only methods that actually use `$el`, `$refs`, or `$watch` — or that call methods which do — need the explicit `this` parameter.

### Type-checking

Vite uses esbuild to compile TypeScript (no type errors at build time). Run `npx tsc --noEmit` separately to catch type errors.

### formComponent — dynamic field system

`formComponent` discovers fields at runtime — do not hardcode field names in it.

- **To add a field:** add an `<input>` or `<select>` to `_FormFields.cshtml` with `x-model="fields.myField"`. Add `required` if mandatory. Add `type="email"` for email format validation. No TS changes needed.
- **`init()`** scans `[x-model^="fields."]` and initialises `fields`, `touched`, `errors`, and a `$watch` per field.
- **`validate()`** reads `required` and `type` from the DOM element; reads the error label from the associated `<label for="...">`.
- **`loadData()`** splits the JSON response by type — arrays go to `lists`, scalars go to `fields`. Unknown keys are ignored.

### Inline JSON in attributes

`IJsonHelper.Serialize` returns `IHtmlContent` and is NOT HTML-encoded by Razor. Never put it inside a double-quoted HTML attribute — it will break the attribute parser. Use a `data-*` attribute with a plain `string` serialization:

```razor
@{
    var json = System.Text.Json.JsonSerializer.Serialize(Model.Options,
        new System.Text.Json.JsonSerializerOptions {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        });
}
<div data-options="@json" x-data="myComponent(JSON.parse($el.dataset.options))">
```

### Alpine event handlers in Razor

`@@event` renders as `@event` (Alpine shorthand). This works for simple names (`@@click`, `@@blur`, `@@change`). For modifiers with dots use the longhand to avoid Razor parse errors:

```html
<!-- Works -->
@@click="doThing()"

<!-- Breaks Razor — use longhand instead -->
x-on:submit.prevent="submit()"
```

## Controller Conventions

- GET actions that return JSON: use `new JsonResult(data, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })` so Alpine receives camelCase keys.
- POST actions: `[HttpPost] [ValidateAntiForgeryToken] [FromForm]`. The anti-forgery token is included in the fetch payload as `__RequestVerificationToken` from `document.querySelector('[name=__RequestVerificationToken]')`.
- No redirects after POST — actions return `Ok()` and Alpine handles the success state.

## Adding a New Feature

### New form field
1. Add the input to `_FormFields.cshtml` with `x-model="fields.myField"` and `required` / correct `type`.
2. Add the property to `FormSubmission` in `DashboardViewModels.cs` if it needs to be POSTed.
3. If `LoadFormData` should pre-fill it, add it to `ContactFormData` and the controller action.

### New chart
1. Add a `<partial name="_ChartComponent" model='new ChartComponentViewModel { ... }' />` in the target view.
2. No JS changes needed — `setupChart` is generic.

### New Alpine component
1. Add an interface for the component data and a combined `type MyCtx = MyData & AlpineMagics` if methods need magic props.
2. Register with `Alpine.data('myComponent', (arg: ArgType) => ({ ... }))` in `main.ts` before `Alpine.start()`.
3. Use `x-data="myComponent(...)"` in the Razor view.
4. Pass server data via `data-*` attributes and `JSON.parse($el.dataset.X)`, not inline in the `x-data` string.
5. Run `npx tsc --noEmit` to verify no type errors.
