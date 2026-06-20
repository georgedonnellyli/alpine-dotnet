import './site.scss';
import Alpine from 'alpinejs';
import Chart, { type ChartType } from 'chart.js/auto';

declare global {
    interface Window {
        Alpine: typeof Alpine;
        Chart: typeof Chart;
    }
}

window.Alpine = Alpine;
window.Chart = Chart;

// ─── Shared types ─────────────────────────────────────────────────────────────

interface LookupOption {
    value: string;
    label: string;
}

/** Alpine magic properties injected at runtime — not part of component data */
interface AlpineMagics {
    $el: HTMLElement;
    $refs: Record<string, HTMLElement>;
    $watch(property: string, callback: () => void): void;
}

// ─── Chart component ──────────────────────────────────────────────────────────

Alpine.data('setupChart', (
    serverData: number[],
    serverLabels: string[],
    chartType: ChartType = 'line'
) => ({
    chart: null as Chart | null,

    init(this: { chart: Chart | null } & AlpineMagics) {
        this.chart = new Chart(this.$refs.canvas as HTMLCanvasElement, {
            type: chartType,
            data: {
                labels: serverLabels,
                datasets: [{
                    label: 'Revenue Overview ($)',
                    data: serverData,
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}));

// ─── Form component ───────────────────────────────────────────────────────────

interface FormComponentData {
    options: LookupOption[];
    fields: Record<string, string>;
    touched: Record<string, boolean>;
    errors: Record<string, string>;
    lists: Record<string, unknown[]>;
    loadUrl: string;
    submitUrl: string;
    success: boolean;
    validate(): void;
}

type FormCtx = FormComponentData & AlpineMagics;

Alpine.data('formComponent', (options: LookupOption[]) => ({
    options,
    fields: {} as Record<string, string>,
    touched: {} as Record<string, boolean>,
    errors: {} as Record<string, string>,
    lists: {} as Record<string, unknown[]>,
    loadUrl: '',
    submitUrl: '',
    success: false,

    init(this: FormCtx) {
        this.loadUrl = this.$el.dataset.loadUrl ?? '';
        this.submitUrl = this.$el.dataset.submitUrl ?? '';

        this.$el.querySelectorAll<HTMLElement>('[x-model^="fields."]').forEach(el => {
            const key = el.getAttribute('x-model')!.slice('fields.'.length);
            this.fields[key] = '';
            this.touched[key] = false;
            this.errors[key] = '';
            this.$watch(`fields.${key}`, () => this.validate());
        });

        this.$el.querySelectorAll<HTMLElement>('[data-list]').forEach(el => {
            this.lists[el.getAttribute('data-list')!] = [];
        });
    },

    validate(this: FormCtx) {
        Object.keys(this.fields).forEach(key => {
            const el = this.$el.querySelector<HTMLElement>(`[x-model="fields.${key}"]`);
            const value = this.fields[key] ?? '';
            const label = this.$el
                .querySelector<HTMLElement>(`label[for="${el?.id}"]`)
                ?.textContent?.trim() ?? key;

            if (el?.hasAttribute('required') && !value.trim()) {
                this.errors[key] = `${label} is required.`;
            } else if (el?.getAttribute('type') === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                this.errors[key] = 'A valid email is required.';
            } else {
                this.errors[key] = '';
            }
        });
    },

    showError(field: string): boolean {
        return this.touched[field] && !!this.errors[field];
    },

    async loadData() {
        if (!this.loadUrl) return;
        const res = await fetch(this.loadUrl);
        if (!res.ok) return;
        const data = await res.json() as Record<string, unknown>;
        Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value) && key in this.lists) {
                this.lists[key] = value as unknown[];
            } else if (!Array.isArray(value) && key in this.fields) {
                this.fields[key] = String(value ?? '');
            }
        });
    },

    async submit(this: FormCtx) {
        Object.keys(this.touched).forEach(k => (this.touched[k] = true));
        this.validate();
        if (Object.values(this.errors).some(e => e)) return;

        const tokenEl = document.querySelector<HTMLInputElement>('[name=__RequestVerificationToken]');
        const body = new URLSearchParams({
            ...this.fields,
            __RequestVerificationToken: tokenEl?.value ?? ''
        });

        const res = await fetch(this.submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        if (res.ok) this.success = true;
    }
}));

Alpine.start();
