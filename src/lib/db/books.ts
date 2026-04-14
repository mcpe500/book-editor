import { v4 as uuidv4 } from 'uuid';
import { getDB } from './index';
import type { Book, BookSettings } from '$lib/types';

const defaultSettings: BookSettings = {
	fontFamily: 'sans',
	fontSize: 16,
	lineHeight: 1.6,
	theme: 'light',
	autoSaveInterval: 30
};

export async function createBook(title: string, author?: string): Promise<Book> {
	const db = await getDB();
	const now = new Date();
	const book: Book = {
		id: uuidv4(),
		title,
		author,
		createdAt: now,
		updatedAt: now,
		settings: { ...defaultSettings }
	};
	await db.put('books', book);
	return book;
}

export async function getBook(id: string): Promise<Book | undefined> {
	const db = await getDB();
	return db.get('books', id);
}

export async function getAllBooks(): Promise<Book[]> {
	const db = await getDB();
	return db.getAllFromIndex('books', 'by-updated');
}

export async function updateBook(book: Book): Promise<void> {
	const db = await getDB();
	book.updatedAt = new Date();
	await db.put('books', book);
}

export async function deleteBook(id: string): Promise<void> {
	const db = await getDB();

	const chapters = await db.getAllFromIndex('chapters', 'by-book', id);
	for (const chapter of chapters) {
		await db.delete('chapters', chapter.id);
	}

	const versions = await db.getAllFromIndex('versions', 'by-book', id);
	for (const version of versions) {
		await db.delete('versions', version.id);
	}

	const assets = await db.getAllFromIndex('assets', 'by-book', id);
	for (const asset of assets) {
		await db.delete('assets', asset.id);
	}

	await db.delete('books', id);
}
