<script lang="ts">
	import { settingsState } from '$lib/stores/settings.svelte';
	import type { FontFamily, Theme } from '$lib/types';

	let { onClose = () => {} }: { onClose?: () => void } = $props();

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleFontFamilyChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as FontFamily;
		settingsState.update({ fontFamily: value });
	}

	function handleFontSizeChange(e: Event) {
		const value = parseInt((e.target as HTMLInputElement).value);
		settingsState.update({ fontSize: value });
	}

	function handleLineHeightChange(e: Event) {
		const value = parseFloat((e.target as HTMLInputElement).value);
		settingsState.update({ lineHeight: value });
	}

	function handleThemeChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as Theme;
		settingsState.update({ theme: value });
	}

	function handleReset() {
		settingsState.reset();
	}
</script>

<div class="modal-overlay" onclick={handleOverlayClick} role="presentation">
	<div class="modal">
		<div class="modal-header">
			<h2>Settings</h2>
			<button class="close-btn" onclick={onClose}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>

		<div class="modal-content">
			<div class="setting-group">
				<label class="setting-label">Font Family</label>
				<select
					class="setting-select"
					value={settingsState.fontFamily}
					onchange={handleFontFamilyChange}
				>
					<option value="sans">Sans Serif (Inter)</option>
					<option value="serif">Serif (Georgia)</option>
					<option value="mono">Monospace (Fira Code)</option>
				</select>
			</div>

			<div class="setting-group">
				<label class="setting-label">Font Size: {settingsState.fontSize}px</label>
				<input
					type="range"
					min="12"
					max="24"
					step="1"
					value={settingsState.fontSize}
					oninput={handleFontSizeChange}
					class="setting-slider"
				/>
			</div>

			<div class="setting-group">
				<label class="setting-label">Line Height: {settingsState.lineHeight.toFixed(1)}</label>
				<input
					type="range"
					min="1.2"
					max="2.0"
					step="0.1"
					value={settingsState.lineHeight}
					oninput={handleLineHeightChange}
					class="setting-slider"
				/>
			</div>

			<div class="setting-group">
				<label class="setting-label">Theme</label>
				<select class="setting-select" value={settingsState.theme} onchange={handleThemeChange}>
					<option value="light">Light</option>
					<option value="dark">Dark</option>
					<option value="system">System</option>
				</select>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn-secondary" onclick={handleReset}>Reset to Defaults</button>
			<button class="btn-primary" onclick={onClose}>Done</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 0.75rem;
		width: 100%;
		max-width: 480px;
		box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h2 {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		color: #64748b;
	}

	.close-btn:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.modal-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.setting-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.setting-select {
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
	}

	.setting-select:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
	}

	.setting-slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: #e2e8f0;
		appearance: none;
		cursor: pointer;
	}

	.setting-slider::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #2563eb;
		cursor: pointer;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
		border: none;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-secondary {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover {
		background: #f9fafb;
	}
</style>
