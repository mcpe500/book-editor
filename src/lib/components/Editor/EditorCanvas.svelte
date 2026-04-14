<script lang="ts">
	import { editorState } from '$lib/stores/book.svelte';
	import { settingsState } from '$lib/stores/settings.svelte';
	import { parseMarkdown, countWords } from '$lib/utils/markdown';
	import { updateChapter } from '$lib/db/chapters';

	let {
		onInsertImage = () => {},
		onInsertTable = () => {},
		onInsertMath = () => {}
	}: {
		onInsertImage?: () => void;
		onInsertTable?: () => void;
		onInsertMath?: () => void;
	} = $props();

	let textareaEl: HTMLTextAreaElement | null = $state(null);
	let content = $state('');
	let wordCount = $derived(countWords(content));

	$effect(() => {
		if (editorState.currentChapter) {
			content = editorState.currentChapter.content;
		}
	});

	async function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		content = target.value;

		if (editorState.currentChapter) {
			editorState.currentChapter.content = content;
			editorState.markChanged();
		}
	}

	async function handleSave() {
		if (editorState.currentBook && editorState.currentChapter) {
			await updateChapter(editorState.currentChapter);
			editorState.markSaved();
		}
	}

	function insertAtCursor(before: string, after: string = '') {
		if (!textareaEl) return;

		const start = textareaEl.selectionStart;
		const end = textareaEl.selectionEnd;
		const selected = content.substring(start, end);

		content = content.substring(0, start) + before + selected + after + content.substring(end);

		setTimeout(() => {
			if (textareaEl) {
				const newPos = start + before.length + selected.length + after.length;
				textareaEl.focus();
				textareaEl.setSelectionRange(newPos, newPos);
			}
		}, 0);
	}

	function handleBold() {
		insertAtCursor('**', '**');
	}

	function handleItalic() {
		insertAtCursor('*', '*');
	}

	function handleHeading(level: number) {
		const prefix = '#'.repeat(level) + ' ';
		const start = textareaEl?.selectionStart ?? 0;
		const lineStart = content.lastIndexOf('\n', start - 1) + 1;
		content = content.substring(0, lineStart) + prefix + content.substring(lineStart);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey) {
			switch (e.key) {
				case 's':
					e.preventDefault();
					handleSave();
					break;
				case 'b':
					e.preventDefault();
					handleBold();
					break;
				case 'i':
					e.preventDefault();
					handleItalic();
					break;
			}
		}
	}
</script>

<div class="editor-panel">
	<div class="toolbar">
		<div class="toolbar-group">
			<button class="tool-btn" onclick={handleBold} title="Bold (Ctrl+B)">
				<strong>B</strong>
			</button>
			<button class="tool-btn" onclick={handleItalic} title="Italic (Ctrl+I)">
				<em>I</em>
			</button>
		</div>

		<div class="toolbar-divider"></div>

		<div class="toolbar-group">
			<button class="tool-btn" onclick={() => handleHeading(1)} title="Heading 1">H1</button>
			<button class="tool-btn" onclick={() => handleHeading(2)} title="Heading 2">H2</button>
			<button class="tool-btn" onclick={() => handleHeading(3)} title="Heading 3">H3</button>
		</div>

		<div class="toolbar-divider"></div>

		<div class="toolbar-group">
			<button class="tool-btn" onclick={onInsertImage} title="Insert Image">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
					<circle cx="8.5" cy="8.5" r="1.5"></circle>
					<polyline points="21 15 16 10 5 21"></polyline>
				</svg>
			</button>
			<button class="tool-btn" onclick={onInsertTable} title="Insert Table">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
					<line x1="3" y1="9" x2="21" y2="9"></line>
					<line x1="3" y1="15" x2="21" y2="15"></line>
					<line x1="9" y1="3" x2="9" y2="21"></line>
					<line x1="15" y1="3" x2="15" y2="21"></line>
				</svg>
			</button>
			<button class="tool-btn" onclick={onInsertMath} title="Insert Math (Ctrl+Shift+M)">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
			</button>
		</div>

		<div class="toolbar-spacer"></div>

		<div class="toolbar-group">
			{#if editorState.hasUnsavedChanges}
				<span class="save-indicator unsaved">Unsaved</span>
			{:else if editorState.lastSaved}
				<span class="save-indicator saved">Saved</span>
			{/if}
		</div>
	</div>

	<div class="editor-content">
		<textarea
			bind:this={textareaEl}
			value={content}
			oninput={handleInput}
			onkeydown={handleKeydown}
			placeholder="Start writing..."
			class="editor-textarea"
			style="
				font-family: {settingsState.fontFamily === 'serif'
				? 'Georgia, serif'
				: settingsState.fontFamily === 'mono'
					? 'monospace'
					: 'sans-serif'};
				font-size: {settingsState.fontSize}px;
				line-height: {settingsState.lineHeight};
			"
		></textarea>
	</div>

	<div class="status-bar">
		<span class="word-count">{wordCount} words</span>
	</div>
</div>

<style>
	.editor-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: white;
		min-width: 0;
	}

	.toolbar {
		display: flex;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.toolbar-group {
		display: flex;
		gap: 0.125rem;
	}

	.toolbar-divider {
		width: 1px;
		height: 24px;
		background: #e2e8f0;
		margin: 0 0.25rem;
	}

	.toolbar-spacer {
		flex: 1;
	}

	.tool-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		height: 32px;
		padding: 0 0.5rem;
		background: none;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		color: #475569;
		font-size: 0.875rem;
	}

	.tool-btn:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.save-indicator {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.save-indicator.unsaved {
		background: #fef3c7;
		color: #92400e;
	}

	.save-indicator.saved {
		background: #d1fae5;
		color: #065f46;
	}

	.editor-content {
		flex: 1;
		overflow: hidden;
	}

	.editor-textarea {
		width: 100%;
		height: 100%;
		padding: 1rem;
		border: none;
		resize: none;
		outline: none;
		font-family: inherit;
		color: #0f172a;
		background: white;
	}

	.editor-textarea::placeholder {
		color: #94a3b8;
	}

	.status-bar {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border-top: 1px solid #e2e8f0;
		font-size: 0.75rem;
		color: #64748b;
	}

	.word-count {
		margin-right: 1rem;
	}
</style>
