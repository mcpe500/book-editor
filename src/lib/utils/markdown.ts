import { marked } from 'marked';
import katex from 'katex';

function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}

function renderMath(text: string): string {
	const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
	const inlineMathRegex = /\$([^\$\n]+?)\$/g;

	let result = text;

	result = result.replace(blockMathRegex, (_, math) => {
		try {
			return katex.renderToString(math.trim(), {
				displayMode: true,
				throwOnError: false
			});
		} catch {
			return `<div class="math-error">$$${math}$$</div>`;
		}
	});

	result = result.replace(inlineMathRegex, (_, math) => {
		try {
			return katex.renderToString(math.trim(), {
				displayMode: false,
				throwOnError: false
			});
		} catch {
			return `<span class="math-error">$${math}$</span>`;
		}
	});

	return result;
}

function processImages(text: string): string {
	const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
	return text.replace(imageRegex, (_, alt, src) => {
		return `<figure class="image">
			<img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" />
			${alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : ''}
		</figure>`;
	});
}

function processTables(text: string): string {
	const lines = text.split('\n');
	let inTable = false;
	let result: string[] = [];

	for (let line of lines) {
		if (line.startsWith('|') && line.endsWith('|')) {
			if (!inTable) {
				inTable = true;
				result.push('<table class="MD-table">');
			}

			const cells = line
				.slice(1, -1)
				.split('|')
				.map((c) => c.trim());

			if (cells.some((c) => /^[-:]+$/.test(c))) {
				continue;
			}

			const isHeader = result.length === 1 || !result[result.length - 1].includes('<tr>');
			const tag = isHeader ? 'th' : 'td';
			const row = cells.map((c) => `<${tag}>${escapeHtml(c)}</${tag}>`).join('');
			result.push(`<tr>${row}</tr>`);
		} else {
			if (inTable) {
				result.push('</table>');
				inTable = false;
			}
			result.push(line);
		}
	}

	if (inTable) {
		result.push('</table>');
	}

	return result.join('\n');
}

function processCodeBlocks(text: string): string {
	const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
	return text.replace(codeBlockRegex, (_, lang, code) => {
		return `<pre class="code-block" data-language="${lang}"><code>${escapeHtml(code)}</code></pre>`;
	});
}

function processCrossReferences(text: string): string {
	text = text.replace(/\*\*Gambar (\d+\.\d+)\.\*\*/g, (_, ref) => {
		return `<a href="#gambar-${ref}" class="cross-ref gambar">Gambar ${ref}</a>`;
	});

	text = text.replace(/\*\*Tabel (\d+\.\d+)\.\*\*/g, (_, ref) => {
		return `<a href="#tabel-${ref}" class="cross-ref tabel">Tabel ${ref}</a>`;
	});

	text = text.replace(/\*\*Algoritma (\d+\.\d+)\.\*\*/g, (_, ref) => {
		return `<a href="#algoritma-${ref}" class="cross-ref algoritma">Algoritma ${ref}</a>`;
	});

	return text;
}

export function parseMarkdown(text: string): string {
	let result = text;

	result = processCodeBlocks(result);
	result = processImages(result);
	result = processTables(result);
	result = renderMath(result);
	result = processCrossReferences(result);

	result = marked.parse(result, { async: false }) as string;

	return result;
}

export function extractTOC(content: string): Array<{ level: number; title: string; id: string }> {
	const headingRegex = /^(#{1,6})\s+(.+)$/gm;
	const toc: Array<{ level: number; title: string; id: string }> = [];
	let match;

	while ((match = headingRegex.exec(content))) {
		const level = match[1].length;
		const title = match[2].trim();
		const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
		toc.push({ level, title, id });
	}

	return toc;
}

export function countWords(text: string): number {
	return text.split(/\s+/).filter((word) => word.length > 0).length;
}

export function countCharacters(text: string): number {
	return text.length;
}
