/**
 * Partial GenUI spec parsing: extract the components that are already
 * complete from a still-growing ```dsh-ui fence body, so the UI can render
 * top-down as the model writes — each finished component appears the moment
 * its JSON object closes, instead of the whole block waiting for the fence.
 *
 * Strategy (tolerant, white-list-agnostic, BOUNDED):
 * 1. Full parse first (the common settled case) — at most one.
 * 2. ONE left-to-right scan collects the repair candidates: every position
 *    where the prefix is bracket-balanced (trailing comma / fence tail) and
 *    every top-level `items[]` component close (an unfinished trailing
 *    component is dropped by closing the root array/object). Partial candidates
 *    must parse as a spec root; bare components wait for their own root close.
 *    The ring buffer keeps only the longest-direction candidates (≤ MAX_PARTIAL_REPAIR_ATTEMPTS),
 *    so the work is O(n) with a hard parse-attempt cap — a pathological
 *    input can never re-scan prefixes or burn seconds in JSON.parse.
 * 3. Candidates are tried longest first; the first that parses as a GenUI
 *    spec wins. Nothing parses → null (streaming partial, wait for more).
 *
 * The result is only ever a PREFIX of the intended spec, so it is always
 * safe to render: components already present are complete and valid.
 *
 * `ponytail:` the 32-candidate / 33-parse budget is the protection ceiling;
 * only real streaming samples proving a recovery shortfall justify switching
 * to a tokenizing parser.
 */
import { type GenuiSpec } from './spec.ts';
/** Default repair-candidate budget (adjustable; see the design doc). */
export declare const MAX_PARTIAL_REPAIR_ATTEMPTS = 32;
/** How many early-closed roots one body may carry before the repair gives up. */
export declare const MAX_REATTACH_PASSES = 8;
/** Override the repair-candidate budget (tests / tuning). */
export declare function setMaxPartialRepairAttempts(n: number): void;
/** One repair candidate: a balanced prefix of the body ending at `end`,
 *  plus the closing brackets to append (empty when already balanced). */
export interface PartialCandidate {
    end: number;
    closingSuffix: string;
}
/** Single left-to-right pass over the raw body. Tracks the bracket stack
 *  (skipping strings/escapes correctly) and records:
 *  - every position where the prefix is fully balanced (trailing comma or
 *    fence tail) — candidate with an empty closing suffix;
 *  - every top-level `items[]` component close — candidate with the root
 *    array/object closed (an unfinished trailing component is dropped). Nested
 *    object closes are not candidates because their component is still partial.
 *  Candidates are ring-buffered to the attempts budget (the LAST pushes are
 *  the longest), then returned longest-first, deduplicated by end. The scan
 *  stops at the first unbalanced close — earlier balanced prefixes remain
 *  valid candidates.
 *
 * Exposed for tests (the `scannedChars` diagnostic); not exported from the
 * package entry. The parser calls this exactly once per parse.
 */
export declare function collectPartialCandidates(raw: string): {
    candidates: PartialCandidate[];
    scannedChars: number;
};
/**
 * Reattach components the model stranded outside an early-closed root.
 *
 * Observed in the wild: the model closes `items` and the root object, then
 * keeps appending components as if still inside the array —
 * `{"title":…,"items":[A,B]},{"type":"table",…}]}`. The body is not
 * incomplete, so tier-2 completion does not apply; and the forward scan stops
 * at the first unbalanced close, so the longest candidate stays the
 * already-closed prefix. The card therefore freezes on A and B for the rest
 * of the message and only fills in once the message settles.
 *
 * The repair is deterministic string surgery, safe while streaming: it fires
 * only when a COMPLETE root object is followed by `,`, and it reopens that
 * root's `items` array so the stranded text continues it. Whatever follows is
 * still handed to the normal candidate scan, so a half-written trailing
 * component is dropped exactly as before.
 * @param text - the trimmed fence body.
 * @returns the reopened body, or null when this damage is not present.
 */
export declare function reattachStrandedItems(text: string): string | null;
/**
 * Parse a possibly incomplete genui spec body.
 * @param raw - the fence body as accumulated so far.
 * @returns a spec containing only finished components, or null when nothing
 *   usable has been written yet.
 */
export declare function parsePartialGenuiSpec(raw: string): GenuiSpec | null;
