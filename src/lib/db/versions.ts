import { v4 as uuidv4 } from 'uuid';
import { getDB } from './index';
import type { Version, Book } from '$lib/types';
import { getBook } from './books';

function countWords(text: string): number {
	return text.split(/\s+/).filter((word) => word.length > 0).length;
}

export async function createVersion(bookId: string, label?: string): Promise<Version> {
	const db = await getDB();
	const book = await getBook(bookId);

	if (!book) {
		throw new Error('Book not found');
	}

	const snapshot = JSON.stringify(book);
	const version: Version = {
		id: uuidv4(),
		bookId,
		timestamp: new Date(),
		label,
		snapshot,
		wordCount: countWords(JSON.stringify(book))
	};

	await db.put('versions', version);
	return version;
}

export async function getVersion(id: string): Promise<Version | undefined> {
	const db = await getDB();
	return db.get('versions', id);
}

export async function getVersionsByBook(bookId: string): Promise<Version[]> {
	const db = await getDB();
	const versions = await db.getAllFromIndex('versions', 'by-book', bookId);
	return versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function restoreVersion(versionId: string): Promise<Book> {
	const db = await getDB();
	const version = await db.get('versions', versionId);

	if (!version) {
		throw new Error('Version not found');
	}

	const book: Book = JSON.parse(version.snapshot);
	book.updatedAt = new Date();

	await db.put('books', book);

	return book;
}
