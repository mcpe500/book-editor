import type { Book, Chapter, Version, Asset } from '$lib/types';

class EditorState {
	currentBook: Book | null = null;
	currentChapter: Chapter | null = null;
	chapters: Chapter[] = [];
	versions: Version[] = [];
	hasUnsavedChanges = false;
	lastSaved: Date | null = null;
	selectedAsset: Asset | null = null;

	setBook(book: Book | null) {
		this.currentBook = book;
		this.hasUnsavedChanges = false;
	}

	setChapter(chapter: Chapter | null) {
		this.currentChapter = chapter;
	}

	setChapters(chapters: Chapter[]) {
		this.chapters = chapters;
	}

	setVersions(versions: Version[]) {
		this.versions = versions;
	}

	markChanged() {
		this.hasUnsavedChanges = true;
	}

	markSaved() {
		this.hasUnsavedChanges = false;
		this.lastSaved = new Date();
	}

	reset() {
		this.currentBook = null;
		this.currentChapter = null;
		this.chapters = [];
		this.versions = [];
		this.hasUnsavedChanges = false;
		this.lastSaved = null;
		this.selectedAsset = null;
	}

	get title(): string {
		return this.currentBook?.title || '';
	}

	get wordCount(): number {
		if (!this.currentChapter?.content) return 0;
		return this.currentChapter.content.split(/\s+/).filter((w) => w.length > 0).length;
	}
}

export const editorState = new EditorState();
