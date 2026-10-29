import { describe, expect, it } from 'vitest'
import { processGenuiSpec, repairGenuiSpec, validateGenuiSpec } from '../src/client/guard.ts'

describe('diff alias compatibility', () => {
  it.each(['diffs', 'diff', 'changes', 'files'])('accepts a single record in %s throughout the pipeline', field => {
    const input = { items: [{ type: 'diff', [field]: { file: 'a.ts', before: 'old', after: 'new' } }] }
    const result = processGenuiSpec(input)
    expect(result.repaired?.items).toEqual([{
      type: 'diff', diffs: [{ path: 'a.ts', oldText: 'old', newText: 'new' }],
    }])
    expect(result.errors).toEqual([])
    expect(validateGenuiSpec(input).ok).toBe(true)
  })

  it('retains empty new content and canonical fields over aliases', () => {
    const input = { items: [{ type: 'diff', diffs: [{
      path: 'canonical.ts', file: 'alias.ts', oldText: null, before: 'ignored', newText: '', after: 'ignored',
    }] }] }
    expect(repairGenuiSpec(input)?.items).toEqual([{
      type: 'diff', diffs: [{ path: 'canonical.ts', oldText: null, newText: '' }],
    }])
  })

  it('rejects records missing a path or new content', () => {
    const result = processGenuiSpec({ items: [{ type: 'diff', files: [{ after: 'new' }, { file: 'a.ts' }] }] })
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.renderedNativeCount).toBe(0)
  })
})

it('normalizes tone synonyms per component and leaves custom nodes opaque', () => {
  const custom = { type: 'custom-widget', tone: 'critical', data: { secretShape: true } }
  const result = processGenuiSpec({ items: [
    { type: 'badge', label: 'Alert', tone: 'warning' },
    { type: 'callout', content: 'Alert', tone: 'danger' },
    custom,
  ] })
  expect(result.errors).toEqual([])
  expect(result.repaired?.items[0]).toMatchObject({ tone: 'warn' })
  expect(result.repaired?.items[1]).toMatchObject({ tone: 'error' })
  expect(result.repaired?.items[2]).toEqual(custom)
})
