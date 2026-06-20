console.log("🚀 VITE IS ALIVE AND RUNNING!");

import './site.scss';
import Alpine from 'alpinejs';
import Chart from 'chart.js/auto';

window.Alpine = Alpine;
window.Chart = Chart;

// Reusable Chart Logic
window.setupChart = function (serverData, serverLabels, chartType = 'line') {
    return {
        chart: null,
        init() {
            this.chart = new window.Chart(this.$refs.canvas, {
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
    }
}

window.formComponent = function (options) {
    return {
        options,
        fields: {},
        touched: {},
        errors: {},
        lists: {},
        loadUrl: '',
        submitUrl: '',
        success: false,
        init() {
            this.loadUrl = this.$el.dataset.loadUrl ?? '';
            this.submitUrl = this.$el.dataset.submitUrl ?? '';
            this.$el.querySelectorAll('[x-model^="fields."]').forEach(el => {
                const key = el.getAttribute('x-model').slice('fields.'.length);
                this.fields[key] = '';
                this.touched[key] = false;
                this.errors[key] = '';
                this.$watch(`fields.${key}`, () => this.validate());
            });
            this.$el.querySelectorAll('[data-list]').forEach(el => {
                this.lists[el.getAttribute('data-list')] = [];
            });
        },
        validate() {
            Object.keys(this.fields).forEach(key => {
                const el = this.$el.querySelector(`[x-model="fields.${key}"]`);
                const value = String(this.fields[key] ?? '');
                const label = this.$el.querySelector(`label[for="${el?.id}"]`)?.textContent?.trim() ?? key;
                if (el?.hasAttribute('required') && !value.trim()) {
                    this.errors[key] = `${label} is required.`;
                } else if (el?.getAttribute('type') === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    this.errors[key] = 'A valid email is required.';
                } else {
                    this.errors[key] = '';
                }
            });
        },
        showError(field) {
            return this.touched[field] && !!this.errors[field];
        },
        async loadData() {
            if (!this.loadUrl) return;
            const res = await fetch(this.loadUrl);
            if (!res.ok) return;
            const data = await res.json();
            Object.entries(data).forEach(([key, value]) => {
                if (Array.isArray(value) && key in this.lists) this.lists[key] = value;
                else if (!Array.isArray(value) && key in this.fields) this.fields[key] = value;
            });
        },
        async submit() {
            Object.keys(this.touched).forEach(k => this.touched[k] = true);
            this.validate();
            if (Object.values(this.errors).some(e => e)) return;

            const token = document.querySelector('[name=__RequestVerificationToken]')?.value ?? '';
            const body = new URLSearchParams({ ...this.fields, __RequestVerificationToken: token });

            const res = await fetch(this.submitUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString()
            });

            if (res.ok) this.success = true;
        }
    };
};

Alpine.start();
