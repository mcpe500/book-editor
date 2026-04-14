export interface Book {
	id: string;
	title: string;
	author?: string;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
	settings: BookSettings;
}

export interface Chapter {
	id: string;
	bookId: string;
	title: string;
	order: number;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Subsection {
	id: string;
	chapterId: string;
	title: string;
	order: number;
	content: string;
}

export interface BookSettings {
	fontFamily: 'sans' | 'serif' | 'mono';
	fontSize: number;
	lineHeight: number;
	theme: 'light' | 'dark' | 'system';
	autoSaveInterval: number;
}

export interface Version {
	id: string;
	bookId: string;
	timestamp: Date;
	label?: string;
	snapshot: string;
	wordCount: number;
}

export interface Asset {
	id: string;
	bookId: string;
	chapterId?: string;
	filename: string;
	mimeType: string;
	data: string;
	size: number;
	createdAt: Date;
}

export type FontFamily = 'sans' | 'serif' | 'mono';
export type Theme = 'light' | 'dark' | 'system';
