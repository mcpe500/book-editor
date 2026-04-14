<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { editorState } from '$lib/stores/book.svelte';
	import { settingsState } from '$lib/stores/settings.svelte';
	import { getBook, updateBook } from '$lib/db/books';
	import { getChaptersByBook, createChapter, deleteChapter } from '$lib/db/chapters';
	import { createVersion, getVersionsByBook } from '$lib/db/versions';
	import Header from '$lib/components/Layout/Header.svelte';
	import TableOfContents from '$lib/components/Outline/TableOfContents.svelte';
	import EditorCanvas from '$lib/components/Editor/EditorCanvas.svelte';
	import BookPreview from '$lib/components/Preview/BookPreview.svelte';
	import SettingsModal from '$lib/components/Settings/SettingsModal.svelte';
	import { downloadMarkdown, exportToPDF } from '$lib/utils/export';
	import type { Chapter } from '$lib/types';

	let showSettings = $state(false);
	let showExportMenu = $state(false);
	let showImageModal = $state(false);
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		const bookId = page.params.id;
		if (bookId) {
			await loadBook(bookId);
		}
	});

	async function loadBook(bookId: string) {
		const book = await getBook(bookId);
		if (book) {
			editorState.setBook(book);
			const chapters = await getChaptersByBook(bookId);
			editorState.setChapters(chapters);

			if (chapters.length === 0) {
				await handleAddChapter();
			} else {
				editorState.setChapter(chapters[0]);
			}

			const versions = await getVersionsByBook(bookId);
			editorState.setVersions(versions);
		}
	}

	async function handleChapterSelect(chapter: Chapter) {
		await saveCurrentChapter();
		editorState.setChapter(chapter);
	}

	async function handleAddChapter() {
		if (!editorState.currentBook) return;

		const title = `Chapter ${editorState.chapters.length + 1}`;
		const chapter = await createChapter(
			editorState.currentBook.id,
			title,
			editorState.chapters.length
		);
		editorState.chapters = [...editorState.chapters, chapter];
		editorState.setChapter(chapter);
	}

	async function handleDeleteChapter(chapterId: string) {
		if (!confirm('Are you sure you want to delete this chapter?')) return;

		await deleteChapter(chapterId);
		editorState.chapters = editorState.chapters.filter((c) => c.id !== chapterId);

		if (editorState.currentChapter?.id === chapterId) {
			editorState.setChapter(editorState.chapters[0] || null);
		}
	}

	async function saveCurrentChapter() {
		if (editorState.currentBook && editorState.currentChapter) {
			await updateBook(editorState.currentBook);
		}
	}

	async function handleAutoSave() {
		if (autoSaveTimer) clearTimeout(autoSaveTimer);

		autoSaveTimer = setTimeout(async () => {
			if (editorState.currentBook && editorState.hasUnsavedChanges) {
				await updateBook(editorState.currentBook);
				await createVersion(editorState.currentBook.id, 'Auto-save');
				editorState.markSaved();

				const versions = await getVersionsByBook(editorState.currentBook.id);
				editorState.setVersions(versions);
			}
		}, 30000);
	}

	function handleInsertImage() {
		showImageModal = true;
	}

	function handleInsertTable() {
		const tableTemplate = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |
`;
		if (editorState.currentChapter) {
			editorState.currentChapter.content += '\n' + tableTemplate;
		}
	}

	function handleInsertMath() {
		const mathTemplate = '\n$$\n\\int_0^\\infty f(x) dx\n$$\n';
		if (editorState.currentChapter) {
			editorState.currentChapter.content += mathTemplate;
		}
	}

	function handleExportMarkdown() {
		if (editorState.currentBook) {
			downloadMarkdown(editorState.currentBook, editorState.chapters);
		}
		showExportMenu = false;
	}

	function handleExportPDF() {
		exportToPDF();
		showExportMenu = false;
	}

	function handleSaveVersion() {
		const label = prompt('Enter version label (optional):');
		if (editorState.currentBook) {
			createVersion(editorState.currentBook.id, label || undefined);
			editorState.markSaved();
		}
	}

	$effect(() => {
		if (editorState.hasUnsavedChanges) {
			handleAutoSave();
		}
	});
</script>

<svelte:head>
	<title>{editorState.currentBook?.title || 'Book Editor'} - Editor</title>
</svelte:head>

<div class="editor-layout" data-theme={settingsState.theme}>
	<Header
		title={editorState.currentBook?.title || ''}
		onSettingsClick={() => (showSettings = true)}
		onExportClick={() => (showExportMenu = !showExportMenu)}
	/>

	<div class="main-content">
		<TableOfContents
			onChapterSelect={handleChapterSelect}
			onAddChapter={handleAddChapter}
			onDeleteChapter={handleDeleteChapter}
		/>

		<EditorCanvas
			onInsertImage={handleInsertImage}
			onInsertTable={handleInsertTable}
			onInsertMath={handleInsertMath}
		/>

		<BookPreview />
	</div>

	<div class="status-bar">
		<span class="save-status">
			{#if editorState.hasUnsavedChanges}
				<span class="unsaved">Unsaved changes</span>
			{:else if editorState.lastSaved}
				<span class="saved">Last saved {editorState.lastSaved.toLocaleTimeString()}</span>
			{/if}
		</span>
		<span class="chapter-info">
			{editorState.currentChapter?.title || 'No chapter selected'}
		</span>
	</div>
</div>

{#if showSettings}
	<SettingsModal onClose={() => (showSettings = false)} />
{/if}

{#if showExportMenu}
	<div class="export-menu-overlay" onclick={() => (showExportMenu = false)} role="presentation">
		<div class="export-menu" onclick={(e) => e.stopPropagation()}>
			<button onclick={handleExportMarkdown}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14 2 14 8 20 8"></polyline>
				</svg>
				Export as Markdown
			</button>
			<button onclick={handleExportPDF}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14 2 14 8 20 8"></polyline>
					<line x1="16" y1="13" x2="8" y2="13"></line>
					<line x1="16" y1="17" x2="8" y2="17"></line>
				</svg>
				Export as PDF
			</button>
			<hr />
			<button onclick={handleSaveVersion}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
					<polyline points="17 21 17 13 7 13 7 21"></polyline>
					<polyline points="7 3 7 8 15 8"></polyline>
				</svg>
				Save Version
			</button>
		</div>
	</div>
{/if}

{#if showImageModal}
	<div class="modal-overlay" onclick={() => (showImageModal = false)} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Insert Image</h2>
			</div>
			<div class="modal-content">
				<div class="form-group">
					<label>Image URL</label>
					<input type="text" placeholder="https://example.com/image.png" id="image-url" />
				</div>
				<div class="form-group">
					<label>Caption (optional)</label>
					<input type="text" placeholder="Image caption" id="image-caption" />
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn-secondary" onclick={() => (showImageModal = false)}>Cancel</button>
				<button
					class="btn-primary"
					onclick={() => {
						const urlInput = document.getElementById('image-url') as HTMLInputElement;
						const captionInput = document.getElementById('image-caption') as HTMLInputElement;
						if (urlInput?.value && editorState.currentChapter) {
							const alt = captionInput?.value || 'Image';
							editorState.currentChapter.content += `\n![${alt}](${urlInput.value})\n`;
							showImageModal = false;
						}
					}}>Insert</button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	.editor-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: white;
	}

	.main-content {
		flex: 1;
		display: flex;
		overflow: hidden;
	}

	.status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: #f8fafc;
		border-top: 1px solid #e2e8f0;
		font-size: 0.75rem;
		color: #64748b;
	}

	.save-status .unsaved {
		color: #f59e0b;
	}

	.save-status .saved {
		color: #10b981;
	}

	.export-menu-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
	}

	.export-menu {
		position: absolute;
		top: 56px;
		right: 1rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
		min-width: 200px;
	}

	.export-menu button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		font-size: 0.875rem;
		color: #374151;
	}

	.export-menu button:hover {
		background: #f1f5f9;
	}

	.export-menu hr {
		border: none;
		border-top: 1px solid #e2e8f0;
		margin: 0.25rem 0;
	}

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
		max-width: 400px;
		box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
	}

	.modal-header {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h2 {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.modal-content {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.form-group input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-primary {
		padding: 0.625rem 1rem;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-secondary {
		padding: 0.625rem 1rem;
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-secondary:hover {
		background: #f9fafb;
	}

	:global([data-theme='dark']) {
		--bg-primary: #0f172a;
		--bg-secondary: #1e293b;
		--text-primary: #f8fafc;
		--text-secondary: #94a3b8;
		--border-color: #334155;
	}

	@media print {
		.status-bar,
		:global(header),
		:global(aside) {
			display: none !important;
		}

		.main-content {
			display: block;
		}
	}
</style>
