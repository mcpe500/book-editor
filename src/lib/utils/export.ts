import type { Book, Chapter } from '$lib/types';

export function exportToMarkdown(book: Book, chapters: Chapter[]): string {
	let md = `# ${book.title}\n\n`;

	if (book.author) {
		md += `**Author:** ${book.author}\n\n`;
	}

	if (book.description) {
		md += `${book.description}\n\n`;
	}

	md += `---\n\n`;

	for (const chapter of chapters) {
		md += `## ${chapter.title}\n\n`;
		md += chapter.content + '\n\n';
	}

	return md;
}

export function downloadMarkdown(book: Book, chapters: Chapter[]): void {
	const md = exportToMarkdown(book, chapters);
	const blob = new Blob([md], { type: 'text/markdown' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = `${book.title.replace(/[^a-z0-9]/gi, '_')}.md`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function exportToPDF(): void {
	window.print();
}
