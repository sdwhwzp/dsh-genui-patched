/**
 * Minimal inline markup for text-bearing fields.
 *
 * Prose-heavy answers need emphasis INSIDE a sentence: a command, a term, a key
 * phrase, a link. Until now every field was a plain string, so emphasis meant
 * splitting one sentence into several nodes and the paragraph read as broken.
 *
 * Supported (deliberately tiny, no nesting):
 *   `code`            inline code chip
 *   **bold**          emphasis that does not wrap or become a block
 *   ==mark==          highlight
 *   [text](https://…) inline link (http/https/mailto only)
 *
 * Safety: this NEVER produces HTML. Each token becomes a React element, so the
 * host's HTML parser is never involved (the whole client builds elements, the
 * only innerHTML in the project is mermaid's sanitized SVG). An unterminated or
 * unknown marker is rendered literally rather than erroring, and a link whose
 * href fails {@link safeHref} degrades to its label text.
 * @module @changfenhuang/dsh-genui/client/inline
 */
import { type ReactNode } from 'react';
/** True when the string contains anything the parser understands. */
export declare function hasInlineMarkup(text: string): boolean;
/**
 * Render one string as React nodes with inline markup applied.
 * @param text - the raw field value.
 * @returns the original string when nothing matched, else the node list.
 */
export declare function renderInline(text: string): ReactNode;
