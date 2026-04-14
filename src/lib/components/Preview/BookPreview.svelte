<script lang="ts">
	import { editorState } from '$lib/stores/book.svelte';
	import { settingsState } from '$lib/stores/settings.svelte';
	import { parseMarkdown } from '$lib/utils/markdown';

	let renderedContent = $derived(
		editorState.currentChapter?.content
			? parseMarkdown(editorState.currentChapter.content)
			: '<p class="placeholder">Preview will appear here...</p>'
	);
</script>

<div class="preview-panel">
	<div class="preview-header">
		<h3>Preview</h3>
	</div>

	<div
		class="preview-content markdown-body"
		style="
			font-family: {settingsState.fontFamily === 'serif'
			? 'Georgia, serif'
			: settingsState.fontFamily === 'mono'
				? 'monospace'
				: 'sans-serif'};
			font-size: {settingsState.fontSize}px;
			line-height: {settingsState.lineHeight};
		"
	>
		{@html renderedContent}
	</div>
</div>

<style>
	.preview-panel {
		width: 400px;
		background: white;
		border-left: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
	}

	.preview-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.preview-header h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.preview-content {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}

	:global(.markdown-body) {
		color: #0f172a;
	}

	:global(.markdown-body h1) {
		font-size: 1.875rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	:global(.markdown-body h2) {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 1.5rem 0 0.75rem 0;
	}

	:global(.markdown-body h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 1.25rem 0 0.5rem 0;
	}

	:global(.markdown-body p) {
		margin: 0.75rem 0;
	}

	:global(.markdown-body ul, .markdown-body ol) {
		margin: 0.75rem 0;
		padding-left: 1.5rem;
	}

	:global(.markdown-body li) {
		margin: 0.25rem 0;
	}

	:global(.markdown-body code) {
		font-family: 'Fira Code', monospace;
		font-size: 0.875em;
		background: #f1f5f9;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	:global(.markdown-body pre.code-block) {
		background: #1e293b;
		color: #e2e8f0;
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.markdown-body pre.code-block code) {
		background: none;
		padding: 0;
		color: inherit;
	}

	:global(.markdown-body figure.image) {
		margin: 1rem 0;
		text-align: center;
	}

	:global(.markdown-body figure.image img) {
		max-width: 100%;
		border-radius: 0.5rem;
	}

	:global(.markdown-body figure.image figcaption) {
		font-size: 0.875rem;
		color: #64748b;
		margin-top: 0.5rem;
	}

	:global(.markdown-body table.MD-table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
	}

	:global(.markdown-body table.MD-table th, .markdown-body table.MD-table td) {
		border: 1px solid #e2e8f0;
		padding: 0.5rem 0.75rem;
		text-align: left;
	}

	:global(.markdown-body table.MD-table th) {
		background: #f8fafc;
		font-weight: 600;
	}

	:global(.markdown-body table.MD-table tr:hover) {
		background: #f8fafc;
	}

	:global(.markdown-body .math-inline) {
		display: inline;
	}

	:global(.markdown-body .math-block) {
		display: block;
		text-align: center;
		margin: 1rem 0;
		overflow-x: auto;
	}

	:global(.markdown-body .math-error) {
		color: #ef4444;
		font-family: monospace;
		background: #fef2f2;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	:global(.markdown-body .cross-ref) {
		color: #2563eb;
		text-decoration: none;
		border-bottom: 1px dashed #2563eb;
	}

	:global(.markdown-body .cross-ref:hover) {
		border-bottom-style: solid;
	}

	:global(.markdown-body .placeholder) {
		color: #94a3b8;
		font-style: italic;
		text-align: center;
		padding: 2rem;
	}
</style>
