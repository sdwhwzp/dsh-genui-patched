/**
 * Editorial diagram theme: the diagram-design semantic-token system ported
 * into the dsh-genui renderer. Every diagram draws from these roles — never
 * from inline hex in the layout code — and a spec-level `theme` override
 * merges over the defaults, mirroring diagram-design's style-guide.md.
 *
 * Two skins ship: light and dark (the dark palette is the jet-black
 * inversion, same roles). The `editorial` variant is the full skin and
 * defaults to light unless the host theme is dark.
 * @module @changfenhuang/dsh-genui/client/blocks/diagram/theme
 */
import type { GenuiDiagramTheme, GenuiDiagramVariant } from '../../spec.ts';
export interface DiagramPalette {
    paper: string;
    paper2: string;
    ink: string;
    muted: string;
    soft: string;
    rule: string;
    accent: string;
    accentTint: string;
    link: string;
}
/**
 * Palette derived from the HOST design tokens.
 *
 * The hardcoded editorial skin (paper #f5f5f5, orange accent #eb6c36) has
 * nothing to do with the surrounding UI: a diagram dropped into a light chat
 * came out as a grey slab with a salmon "focal" node. SVG attributes cannot
 * resolve CSS variables, so the tokens are read as literals here — same
 * approach as the ECharts theming.
 */
export declare function hostPalette(el?: Element | null): DiagramPalette;
/** Resolve the active palette from variant + optional theme overrides. */
export declare function resolvePalette(variant: GenuiDiagramVariant | undefined, theme: GenuiDiagramTheme | undefined, el?: Element | null): DiagramPalette;
/** Node treatment → { fill, stroke, dashed } per diagram-design §5. */
export declare function nodeTreatment(type: string | undefined, p: DiagramPalette): {
    fill: string;
    stroke: string;
    dashed?: boolean;
};
/** Edge stroke color per semantic kind. */
export declare function edgeStroke(kind: string | undefined, p: DiagramPalette): string;
/** Helper: a color at a given opacity (accepts #hex and rgba() strings). */
export declare function inkAt(color: string, opacity: number): string;
