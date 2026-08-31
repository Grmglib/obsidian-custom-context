import type { Editor, EditorPosition } from 'obsidian';

export interface CodeBlockRange {
	/** Inclusive line index of opening fence. */
	startLine: number;
	/** Inclusive line index of closing fence. */
	endLine: number;
}

const FENCE_RE = /^(\s*)(`{3,}|~{3,})(.*)$/;

/**
 * Finds the fenced code block that contains `line`, or null if the line is not inside one.
 */
export function findCodeBlockAtLine(editor: Editor, line: number): CodeBlockRange | null {
	const lineCount = editor.lineCount();
	if (line < 0 || line >= lineCount) return null;

	let openLine = -1;
	let openFence = '';

	for (let i = 0; i <= line; i++) {
		const match = editor.getLine(i).match(FENCE_RE);
		if (!match) continue;

		const fence = match[2] ?? '';
		if (openLine === -1) {
			openLine = i;
			openFence = fence;
			continue;
		}

		// Closing fence: same character, at least as long as opening
		if (
			fence[0] === openFence[0] &&
			fence.length >= openFence.length
		) {
			if (i >= line && openLine <= line) {
				return { startLine: openLine, endLine: i };
			}
			openLine = -1;
			openFence = '';
		}
	}

	// Unclosed fence: cursor is inside an open block through EOF
	if (openLine !== -1 && openLine <= line) {
		return { startLine: openLine, endLine: lineCount - 1 };
	}

	return null;
}

export function isCursorInCodeBlock(editor: Editor): boolean {
	const cursor = editor.getCursor();
	return findCodeBlockAtLine(editor, cursor.line) !== null;
}

/**
 * Wraps the fenced code block at the cursor in an Obsidian callout.
 * Returns true if a wrap was applied.
 */
export function wrapCodeBlockInCallout(
	editor: Editor,
	calloutType: string,
	cursor?: EditorPosition,
): boolean {
	const pos = cursor ?? editor.getCursor();
	const range = findCodeBlockAtLine(editor, pos.line);
	if (!range) return false;

	const type = normalizeCalloutType(calloutType);
	const lines: string[] = [];
	for (let i = range.startLine; i <= range.endLine; i++) {
		lines.push(editor.getLine(i));
	}

	const wrapped = [`> [!${type}]`, ...lines.map((line) => `> ${line}`)].join(
		'\n',
	);

	const from = { line: range.startLine, ch: 0 };
	const lastLine = editor.getLine(range.endLine);
	const to = { line: range.endLine, ch: lastLine.length };

	editor.replaceRange(wrapped, from, to);

	// Place cursor on the callout header
	editor.setCursor({ line: range.startLine, ch: 0 });
	return true;
}

function normalizeCalloutType(raw: string): string {
	const cleaned = raw.trim().replace(/^\[!|\]$/g, '').toLowerCase();
	return cleaned || 'note';
}
