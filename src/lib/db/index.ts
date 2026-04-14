import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Book, Chapter, Version, Asset } from '$lib/types';

interface BookEditorDB extends DBSchema {
	books: {
		key: string;
		value: Book;
		indexes: { 'by-updated': Date };
	};
	chapters: {
		key: string;
		value: Chapter;
		indexes: { 'by-book': string };
	};
	versions: {
		key: string;
		value: Version;
		indexes: { 'by-book': string };
	};
	assets: {
		key: string;
		value: Asset;
		indexes: { 'by-book': string };
	};
}

let dbInstance: IDBPDatabase<BookEditorDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<BookEditorDB>> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB<BookEditorDB>('book-editor-db', 1, {
		upgrade(db) {
			const bookStore = db.createObjectStore('books', { keyPath: 'id' });
			bookStore.createIndex('by-updated', 'updatedAt');

			const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
			chapterStore.createIndex('by-book', 'bookId');

			const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
			versionStore.createIndex('by-book', 'bookId');

			const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
			assetStore.createIndex('by-book', 'bookId');
		}
	});

	return dbInstance;
}

export async function getDB(): Promise<IDBPDatabase<BookEditorDB>> {
	if (!dbInstance) {
		return initDB();
	}
	return dbInstance;
}
