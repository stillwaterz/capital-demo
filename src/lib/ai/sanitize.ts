/**
 * Enforce the house writing rule on model output: hyphens only, never an em or
 * en dash (CLAUDE.md writing conventions). The model is told this in the system
 * prompt, but it slips, so we strip deterministically at the stream sink. Safe
 * to run per streamed chunk: an em dash is a single codepoint, never split
 * across chunks.
 */

const EM_DASH = "—";
const EN_DASH = "–";

/**
 * Replace em and en dashes with a plain hyphen. The model writes them spaced
 * ("Chanda — your"), so a bare hyphen keeps the existing spacing ("Chanda - your").
 */
export function stripDashes(text: string): string {
  return text.split(EM_DASH).join("-").split(EN_DASH).join("-");
}
