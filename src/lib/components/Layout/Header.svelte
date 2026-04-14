<script lang="ts">
	import { editorState } from '$lib/stores/book.svelte';

	let {
		title = '',
		onSettingsClick = () => {},
		onExportClick = () => {}
	}: {
		title?: string;
		onSettingsClick?: () => void;
		onExportClick?: () => void;
	} = $props();

	let editingTitle = $state(false);
	let titleInput = $state(title);

	function startEditTitle() {
		titleInput = title;
		editingTitle = true;
	}

	function saveTitle() {
		editingTitle = false;
		if (editorState.currentBook && titleInput !== title) {
			editorState.currentBook.title = titleInput;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			saveTitle();
		} else if (e.key === 'Escape') {
			editingTitle = false;
		}
	}
</script>

<header class="header">
	<div class="header-left">
		<a href="/" class="logo">Book Editor</a>
	</div>

	<div class="header-center">
		{#if editingTitle}
			<input
				type="text"
				bind:value={titleInput}
				onblur={saveTitle}
				onkeydown={handleKeydown}
				class="title-input"
				autofocus
			/>
		{:else}
			<button class="title-display" onclick={startEditTitle}>
				{title || 'Untitled Book'}
			</button>
		{/if}
	</div>

	<div class="header-right">
		<button class="icon-btn" onclick={onSettingsClick} title="Settings">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="3"></circle>
				<path
					d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
				></path>
			</svg>
		</button>
		<button class="icon-btn" onclick={onExportClick} title="Export">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
				<polyline points="7 10 12 15 17 10"></polyline>
				<line x1="12" y1="15" x2="12" y2="3"></line>
			</svg>
		</button>
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		padding: 0 1rem;
		background: white;
		border-bottom: 1px solid #e2e8f0;
	}

	.header-left {
		flex: 0 0 auto;
	}

	.logo {
		font-weight: 600;
		font-size: 1.125rem;
		color: #0f172a;
		text-decoration: none;
	}

	.header-center {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	.title-display {
		font-size: 1rem;
		font-weight: 500;
		color: #0f172a;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
	}

	.title-display:hover {
		background: #f1f5f9;
	}

	.title-input {
		font-size: 1rem;
		font-weight: 500;
		text-align: center;
		padding: 0.25rem 0.75rem;
		border: 1px solid #2563eb;
		border-radius: 0.375rem;
		outline: none;
	}

	.header-right {
		flex: 0 0 auto;
		display: flex;
		gap: 0.5rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: none;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		color: #64748b;
	}

	.icon-btn:hover {
		background: #f1f5f9;
		color: #0f172a;
	}
</style>
