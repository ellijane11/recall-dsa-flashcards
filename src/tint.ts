// Text colour / highlight markup written by the editor toolbar:  ⟦c:#hex|text⟧ (colour)  ⟦h:#hex|text⟧ (highlight).
// Each marker covers one line, so it survives paragraphs, lists and brackets inside the text.
// Older notes used [[c:#hex|text]]; those are upgraded when rendered.

export const TINT_RE = /⟦[ch]:#[0-9a-fA-F]{3,8}\|([^⟧]*)⟧/g
const LEGACY_RE = /\[\[([ch]):(#[0-9a-fA-F]{3,8})\|([\s\S]*?)\]\]/g
const LINE_PREFIX = /^(\s*(?:[-*+]\s+|\d+\.\s+|#{1,6}\s+|>\s*)*)([\s\S]*)$/

/** Wraps text in a marker per line, keeping list/heading prefixes outside so markdown still works. */
export function tintLines(kind: 'c' | 'h', color: string, text: string) {
  return text
    .split('\n')
    .map((line) => {
      const [, prefix, rest] = LINE_PREFIX.exec(line)!
      return rest.trim() ? `${prefix}⟦${kind}:${color}|${rest}⟧` : line
    })
    .join('\n')
}

export const stripTint = (text: string) =>
  text.replace(TINT_RE, '$1').replace(LEGACY_RE, '$3')

/** Upgrade old [[...]] markers (which may span lines) to the per-line form. */
export const upgradeTint = (md: string) =>
  md.replace(LEGACY_RE, (_, kind: 'c' | 'h', color: string, text: string) => tintLines(kind, color, stripTint(text)))
