<script lang="ts">
	import { editorState } from '$lib/stores/book.svelte';
	import type { Chapter } from '$lib/types';

	let {
		onChapterSelect = (chapter: Chapter) => {},
		onAddChapter = () => {},
		onDeleteChapter = (id: string) => {}
	}: {
		onChapterSelect?: (chapter: Chapter) => void;
		onAddChapter?: () => void;
		onDeleteChapter?: (id: string) => void;
	} = $props();

	let collapsed = $state(false);
	let contextMenuChapter = $state<Chapter | null>(null);
	let contextMenuPos = $state({ x: 0, y: 0 });

	function handleContextMenu(e: MouseEvent, chapter: Chapter) {
		e.preventDefault();
		contextMenuChapter = chapter;
		contextMenuPos = { x: e.clientX, y: e.clientY };
	}

	function closeContextMenu() {
		contextMenuChapter = null;
	}

	function selectChapter(chapter: Chapter) {
		editorState.setChapter(chapter);
		onChapterSelect(chapter);
	}

	function handleDelete() {
		if (contextMenuChapter) {
			onDeleteChapter(contextMenuChapter.id);
			closeContextMenu();
		}
	}
</script>

<svelte:window onclick={closeContextMenu} />

<aside class="outline" class:collapsed>
	<div class="outline-header">
		{#if !collapsed}
			<h2>Outline</h2>
		{/if}
		<button class="collapse-btn" onclick={() => (collapsed = !collapsed)}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				{#if collapsed}
					<polyline points="9 18 15 12 9 6"></polyline>
				{:else}
					<polyline points="15 18 9 12 15 6"></polyline>
				{/if}
			</svg>
		</button>
	</div>

	{#if !collapsed}
		<div class="chapter-list">
			{#each editorState.chapters as chapter, i (chapter.id)}
				<div
					class="chapter-item"
					class:active={editorState.currentChapter?.id === chapter.id}
					onclick={() => selectChapter(chapter)}
					oncontextmenu={(e) => handleContextMenu(e, chapter)}
					role="button"
					tabindex="0"
				>
					<span class="chapter-number">{i + 1}.</span>
					<span class="chapter-title">{chapter.title || 'Untitled Chapter'}</span>
				</div>
			{/each}
		</div>

		<button class="add-chapter-btn" onclick={onAddChapter}>
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
			Add Chapter
		</button>
	{/if}
</aside>

{#if contextMenuChapter}
	<div class="context-menu" style="left: {contextMenuPos.x}px; top: {contextMenuPos.y}px">
		<button onclick={handleDelete}>Delete</button>
	</div>
{/if}

<style>
	.outline {
		width: 280px;
		background: white;
		border-right: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		transition: width 0.2s ease;
	}

	.outline.collapsed {
		width: 48px;
	}

	.outline-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.outline-header h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: none;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		color: #64748b;
	}

	.collapse-btn:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.chapter-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.chapter-item {
		display: flex;
		align-items: center;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		cursor: pointer;
		gap: 0.5rem;
		color: #475569;
		font-size: 0.875rem;
	}

	.chapter-item:hover {
		background: #f1f5f9;
	}

	.chapter-item.active {
		background: #eff6ff;
		color: #2563eb;
		font-weight: 500;
	}

	.chapter-number {
		color: #94a3b8;
		min-width: 1.5rem;
	}

	.chapter-title {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.add-chapter-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin: 0.5rem;
		padding: 0.5rem;
		background: none;
		border: 1px dashed #e2e8f0;
		border-radius: 0.375rem;
		cursor: pointer;
		color: #64748b;
		font-size: 0.875rem;
	}

	.add-chapter-btn:hover {
		border-color: #2563eb;
		color: #2563eb;
		background: #eff6ff;
	}

	.context-menu {
		position: fixed;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		z-index: 1000;
	}

	.context-menu button {
		display: block;
		width: 100%;
		padding: 0.5rem 1rem;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		font-size: 0.875rem;
		color: #ef4444;
	}

	.context-menu button:hover {
		background: #fef2f2;
	}
</style>
