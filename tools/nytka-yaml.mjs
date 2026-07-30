// ---------------------------------------------------------------------------------------
// GENERATED FILE — DO NOT EDIT.
//
// Source:      @nytka/cli/src/lint.mjs
// Regenerate:  npm run vendor  (in the kd-nytka repo, packages/cli)
//
// Committed here on purpose: this repo must be runnable with nothing installed, so the
// lint everyone is asked to run cannot require an npm install first. It is a read-only
// view of a source that lives elsewhere, which is what SPEC P2 permits — one writable
// definition of conformance, synced in one direction.
//
// Editing this file makes the two disagree, and a test in the source repo will fail.
// Install the package instead if you want it as a dependency:  npm i -D @nytka/cli
// ---------------------------------------------------------------------------------------
// The one YAML reader in the line. lint and the task commands both use it, and both used to
// carry their own — two subsets that disagreed about wrapped values in different ways, and
// were fixed separately on 2026-07-30. See 0010.
//
// Deliberately a subset: nested maps, "- " lists, inline [a, b] and {a: b}, "|" and ">" block
// scalars, and values that wrap onto following lines. Zero dependencies, because the vendored
// copies in ../nytka must run under bare node with nothing installed (0009, constraint 1).

function stripComment (s) {
  let q = null, out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { out += c; if (c === q) q = null; continue }
    if (c === '"' || c === "'") { q = c; out += c; continue }
    if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) break
    out += c
  }
  return out
}

function splitTop (s) {
  const out = []
  let depth = 0, cur = '', quote = null
  for (const ch of s) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue }
    if (ch === '{' || ch === '[') depth++
    if (ch === '}' || ch === ']') depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out.map(x => x.trim()).filter(Boolean)
}

function scalar (raw) {
  const v = String(raw).trim()
  if (!v) return ''
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1)
  if (v === 'null' || v === '~') return null
  if (v === 'true') return true
  if (v === 'false') return false
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim()
    return inner ? splitTop(inner).map(scalar) : []
  }
  if (v.startsWith('{') && v.endsWith('}')) {
    const o = {}
    for (const part of splitTop(v.slice(1, -1))) {
      const i = part.indexOf(':')
      if (i !== -1) o[part.slice(0, i).trim()] = scalar(part.slice(i + 1))
    }
    return o
  }
  return v
}

export function parseYaml (text, source = 'YAML', { lenient = false } = {}) {
  const lines = text.split('\n').map((raw, n) => ({
    n, raw, body: stripComment(raw), indent: raw.match(/^ */)[0].length
  }))
  let i = 0
  const skip = () => { while (i < lines.length && !lines[i].body.trim()) i++ }
  const fail = (L, msg) => {
    throw new Error(`${source}:${L.n + 1}: ${msg}\n    ${L.raw.trim()}`)
  }
  // Lenient mode steps over a line it cannot read instead of raising, so the two tolerances
  // share one control flow rather than being two parsers again.
  const tolerate = (L, msg) => { if (!lenient) fail(L, msg); i++ }

  function readBlock (parentIndent, style) {
    const buf = []
    let base = null
    while (i < lines.length) {
      const L = lines[i]
      if (!L.raw.trim()) { buf.push(''); i++; continue }
      if (L.indent <= parentIndent) break
      if (base === null) base = L.indent
      buf.push(L.raw.slice(base))
      i++
    }
    while (buf.length && buf.at(-1) === '') buf.pop()
    if (style === '>') {
      let out = ''
      for (const l of buf) {
        if (l === '') out += '\n\n'
        else out += (out === '' || out.endsWith('\n\n')) ? l : ' ' + l
      }
      return out.trim()
    }
    return buf.join('\n')
  }

  // A quoted or bracketed value may wrap onto following, more-indented lines — legal YAML,
  // and used throughout this line's backlogs. Consuming those lines is what stops the parser
  // walking off the end of the structure and abandoning every task that follows.

  function takeQuoted (t) {
    const q = t[0]
    let out = ''
    for (let k = 1; k < t.length; k++) {
      const ch = t[k]
      if (q === '"' && ch === '\\') {
        const nx = t[k + 1]
        out += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx ?? ''
        k++
        continue
      }
      if (ch === q) {
        if (q === "'" && t[k + 1] === "'") { out += "'"; k++; continue }
        return out
      }
      out += ch
    }
    return null   // no closing quote on the text so far
  }

  function balanced (t) {
    let depth = 0, q = null
    for (const ch of t) {
      if (q) { if (ch === q) q = null; continue }
      if (ch === '"' || ch === "'") { q = ch; continue }
      if (ch === '[' || ch === '{') depth++
      else if (ch === ']' || ch === '}') depth--
    }
    return depth <= 0
  }

  // Reads a value starting on `rest`, folding any continuation lines into it.
  function readValue (rest, ownerIndent, startLine) {
    let t = rest.trim()

    if (t[0] === '"' || t[0] === "'") {
      let done = takeQuoted(t)
      while (done === null) {
        if (i >= lines.length) fail(startLine, 'unterminated quoted string')
        const L = lines[i]
        // raw, not body: a # inside the string is not a comment
        if (!L.raw.trim()) { t += '\n'; i++ } else {
          if (L.indent <= ownerIndent) fail(startLine, 'unterminated quoted string')
          t += (t.endsWith('\n') ? '' : ' ') + L.raw.trim()
          i++
        }
        done = takeQuoted(t)
      }
      return done
    }

    if (t[0] === '[' || t[0] === '{') {
      while (!balanced(t)) {
        if (i >= lines.length) fail(startLine, 'unterminated flow collection')
        const L = lines[i]
        if (!L.body.trim()) { i++; continue }
        if (L.indent <= ownerIndent) fail(startLine, 'unterminated flow collection')
        t += ' ' + L.body.trim()
        i++
      }
      return scalar(t)
    }

    while (i < lines.length) {           // plain scalar: YAML folds deeper lines into it
      const L = lines[i]
      if (!L.body.trim() || L.indent <= ownerIndent) break
      const s = L.body.trim()
      if (/^-(\s|$)/.test(s) || /^[A-Za-z_][\w.-]*\s*:(\s|$)/.test(s)) break
      t += ' ' + s
      i++
    }
    return scalar(t)
  }

  function parseMap (indent) {
    const out = {}
    while (true) {
      skip()
      if (i >= lines.length) break
      const L = lines[i]
      if (L.indent < indent) break                 // dedent — this map is finished
      if (L.indent > indent) { tolerate(L, `unexpected indentation, expected ${indent} spaces`); continue }
      const s = L.body.trim()
      if (/^-(\s|$)/.test(s)) break                // a list item ends the map
      const m = s.match(/^([A-Za-z_][\w.-]*)\s*:\s*(.*)$/)
      if (!m) { tolerate(L, 'expected "key: value"'); continue }
      const [, key, rest] = m
      i++
      if (/^[|>]-?\+?$/.test(rest.trim())) out[key] = readBlock(indent, rest.trim()[0])
      else if (rest.trim() === '') { const c = parseNode(indent + 1, indent); out[key] = c === null ? '' : c }
      else out[key] = readValue(rest, indent, L)
    }
    return out
  }

  function parseList (indent) {
    const out = []
    while (true) {
      skip()
      if (i >= lines.length) break
      const L = lines[i]
      if (L.indent < indent) break
      if (L.indent > indent) { tolerate(L, `unexpected indentation in list, expected ${indent} spaces`); continue }
      const s = L.body.trim()
      if (!/^-(\s|$)/.test(s)) break                // a key ends the list
      const lineNo = L.n
      const rest = s.replace(/^-\s*/, '')
      if (/^[A-Za-z_][\w.-]*\s*:/.test(rest)) {
        const dash = L.raw.indexOf('-', L.indent)
        const off = L.raw.slice(dash + 1).search(/\S/)
        const childIndent = off === -1 ? indent + 2 : dash + 1 + off
        lines[i] = { n: lineNo, raw: L.raw, body: ' '.repeat(childIndent) + rest, indent: childIndent }
        const item = parseMap(childIndent)
        Object.defineProperty(item, '__line', { value: lineNo, enumerable: false })
        out.push(item)
      } else { i++; out.push(readValue(rest, indent, L)) }
    }
    return out
  }

  function parseNode (minIndent, listAt = null) {
    skip()
    if (i >= lines.length) return null
    const L = lines[i]
    const item = /^-(\s|$)/.test(L.body.trim())
    if (item && listAt !== null && L.indent === listAt) return parseList(L.indent)
    if (L.indent < minIndent) return null
    return item ? parseList(L.indent) : parseMap(L.indent)
  }

  let doc = parseNode(0) ?? {}
  skip()
  // Reaching here with lines left means a construct was not understood. Returning the part
  // that parsed would be a believable half-answer, which is worse than no answer at all.
  while (i < lines.length) {
    if (!lenient) fail(lines[i], 'unparsed content after the end of the document')
    // Lenient: keep reading, so a document is not truncated by one line it did not like.
    const before = i
    const more = parseNode(0)
    const plain = v => v && typeof v === 'object' && !Array.isArray(v)
    if (plain(doc) && plain(more)) doc = { ...doc, ...more }   // later keys win, as YAML does
    if (i === before) i++
    skip()
  }
  return doc
}

/** Split a document into its frontmatter block and body. */
export function splitFrontmatter (text) {
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null
  return {
    block: text.slice(text.indexOf('\n') + 1, end),
    body: text.slice(text.indexOf('\n', end + 1) + 1),
  }
}

/**
 * Frontmatter, read leniently: a line the subset cannot parse is skipped rather than raised.
 * Lint must never refuse to report on a document because of how the document is written —
 * SPEC §13 forbids rejecting what it does not recognise — so it reads in this mode while the
 * task commands read strictly. One parser, two tolerances, not two parsers.
 */
export function parseFrontmatter (text) {
  const split = splitFrontmatter(text)
  if (!split) return null
  return parseYaml(split.block, 'frontmatter', { lenient: true })
}
