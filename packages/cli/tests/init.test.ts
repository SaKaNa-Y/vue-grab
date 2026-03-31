import { describe, it, expect } from 'vitest'
import { initProject } from '../src'

describe('initProject', () => {
  it('should be a function', () => {
    expect(typeof initProject).toBe('function')
  })
})
