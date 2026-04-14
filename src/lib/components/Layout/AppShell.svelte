<script lang="ts">
	import { settingsState } from '$lib/stores/settings.svelte';

	let { children }: { children?: any } = $props();
</script>

<div class="app-container" data-theme={settingsState.theme}>
	{@render children?.()}
</div>

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: var(--font-sans);
		font-size: 1rem;
		line-height: 1.5;
		color: #0f172a;
		background: #f8fafc;
	}

	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-container[data-theme='dark'] {
		--bg-primary: #0f172a;
		--bg-secondary: #1e293b;
		--text-primary: #f8fafc;
		--text-secondary: #94a3b8;
		--border-color: #334155;
	}

	.app-container[data-theme='light'] {
		--bg-primary: #ffffff;
		--bg-secondary: #f8fafc;
		--text-primary: #0f172a;
		--text-secondary: #64748b;
		--border-color: #e2e8f0;
	}
</style>
