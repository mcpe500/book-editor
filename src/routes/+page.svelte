<script lang="ts">
	import { editorState } from '$lib/stores/book.svelte';
	import { getAllBooks, createBook, deleteBook } from '$lib/db/books';
	import { getChaptersByBook } from '$lib/db/chapters';
	import { onMount } from 'svelte';

	import type { Book } from '$lib/types';

	let books = $state<Book[]>([]);
	let loading = $state(true);
	let showNewBookModal = $state(false);
	let newBookTitle = $state('');

	onMount(async () => {
		await loadBooks();
	});

	async function loadBooks() {
		loading = true;
		books = await getAllBooks();
		loading = false;
	}

	async function handleCreateBook() {
		if (!newBookTitle.trim()) return;

		const book = await createBook(newBookTitle.trim());
		showNewBookModal = false;
		newBookTitle = '';

		window.location.href = `/book/${book.id}`;
	}

	async function handleDeleteBook(id: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (confirm('Are you sure you want to delete this book?')) {
			await deleteBook(id);
			await loadBooks();
		}
	}

	async function openBook(book: Book) {
		editorState.setBook(book);
		const chapters = await getChaptersByBook(book.id);
		editorState.setChapters(chapters);

		if (chapters.length > 0) {
			editorState.setChapter(chapters[0]);
		}

		window.location.href = `/book/${book.id}`;
	}
</script>

<svelte:head>
	<title>Book Editor - Home</title>
</svelte:head>

<div class="home">
	<header class="home-header">
		<h1>Book Editor</h1>
		<p class="subtitle">
			A lightweight editor for academic writing with Markdown and LaTeX support
		</p>
	</header>

	<main class="home-content">
		<div class="section-header">
			<h2>Your Books</h2>
			<button class="btn-primary" onclick={() => (showNewBookModal = true)}>
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
				New Book
			</button>
		</div>

		{#if loading}
			<div class="loading">Loading...</div>
		{:else if books.length === 0}
			<div class="empty-state">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
					<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
				</svg>
				<h3>No books yet</h3>
				<p>Create your first book to start writing</p>
				<button class="btn-primary" onclick={() => (showNewBookModal = true)}>Create Book</button>
			</div>
		{:else}
			<div class="book-grid">
				{#each books as book (book.id)}
					<div class="book-card" onclick={() => openBook(book)}>
						<div class="book-info">
							<h3>{book.title}</h3>
							{#if book.author}
								<p class="author">by {book.author}</p>
							{/if}
							<p class="date">Updated {new Date(book.updatedAt).toLocaleDateString()}</p>
						</div>
						<button class="delete-btn" onclick={(e) => handleDeleteBook(book.id, e)}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polyline points="3 6 5 6 21 6"></polyline>
								<path
									d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
								></path>
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

{#if showNewBookModal}
	<div class="modal-overlay" onclick={() => (showNewBookModal = false)} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Create New Book</h2>
			</div>
			<form
				class="modal-content"
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateBook();
				}}
			>
				<div class="form-group">
					<label for="title">Book Title</label>
					<input
						type="text"
						id="title"
						bind:value={newBookTitle}
						placeholder="Enter book title"
						autofocus
					/>
				</div>
				<div class="modal-actions">
					<button type="button" class="btn-secondary" onclick={() => (showNewBookModal = false)}>
						Cancel
					</button>
					<button type="submit" class="btn-primary" disabled={!newBookTitle.trim()}>
						Create
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.home {
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
	}

	.home-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.home-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #64748b;
		font-size: 1.125rem;
	}

	.home-content {
		max-width: 900px;
		margin: 0 auto;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #0f172a;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: #64748b;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	.empty-state svg {
		color: #cbd5e1;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #0f172a;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: #64748b;
		margin-bottom: 1.5rem;
	}

	.book-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.book-card {
		position: relative;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.25rem;
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.book-card:hover {
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		transform: translateY(-2px);
	}

	.book-info h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #0f172a;
		margin-bottom: 0.25rem;
	}

	.author {
		font-size: 0.875rem;
		color: #475569;
		margin-bottom: 0.5rem;
	}

	.date {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.delete-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		color: #94a3b8;
		opacity: 0;
		transition: all 0.15s ease;
	}

	.book-card:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		background: #fef2f2;
		color: #ef4444;
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

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
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
</style>
