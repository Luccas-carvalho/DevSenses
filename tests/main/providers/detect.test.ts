import { describe, it, expect } from 'vitest'
import { findBinary } from '../../../src/main/providers/detect'

describe('findBinary', () => {
  it('encontra binario existente', () => {
    const path = findBinary('node')
    expect(path).toBeTruthy()
    expect(path).toMatch(/node/)
  })

  it('retorna null pra binario inexistente', () => {
    const path = findBinary('this-binary-does-not-exist-xyz-12345')
    expect(path).toBeNull()
  })
})
