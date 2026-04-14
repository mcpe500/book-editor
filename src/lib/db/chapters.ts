import { v4 as uuidv4 } from 'uuid';
import { getDB } from './index';
import type { Chapter } from '$lib/types';

export async function createChapter(
	bookId: string,
	title: string,
	order: number
): Promise<Chapter> {
	const db = await getDB();
	const now = new Date();
	const chapter: Chapter = {
		id: uuidv4(),
		bookId,
		title,
		order,
		content: '',
		createdAt: now,
		updatedAt: now
	};
	await db.put('chapters', chapter);
	return chapter;
}

export async function getChapter(id: string): Promise<Chapter | undefined> {
	const db = await getDB();
	return db.get('chapters', id);
}

export async function getChaptersByBook(bookId: string): Promise<Chapter[]> {
	const db = await getDB();
	const chapters = await db.getAllFromIndex('chapters', 'by-book', bookId);
	return chapters.sort((a, b) => a.order - b.order);
}

export async function updateChapter(chapter: Chapter): Promise<void> {
	const db = await getDB();
	chapter.updatedAt = new Date();
	await db.put('chapters', chapter);
}

export async function deleteChapter(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('chapters', id);
}

export async function reorderChapters(bookId: string, chapterIds: string[]): Promise<void> {
	const db = await getDB();
	for (let i = 0; i < chapterIds.length; i++) {
		const chapter = await db.get('chapters', chapterIds[i]);
		if (chapter) {
			chapter.order = i;
			chapter.updatedAt = new Date();
			await db.put('chapters', chapter);
		}
	}
}
