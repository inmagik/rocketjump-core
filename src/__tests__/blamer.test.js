import blamer from '../../blamer.macro'

const OLD_ENV = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...OLD_ENV }
})

afterEach(() => {
  process.env = OLD_ENV
})

beforeEach(() => {
  jest.resetModules()
})

describe('blamer', () => {
  it('should hack the world and throw differents errors based on NODE_ENV', () => {
    expect(() => {
      blamer('short', 'long long long')
    }).toThrowError('long long long')

    process.env.NODE_ENV = 'production'
    expect(() => {
      blamer('short', 'long long long')
    }).toThrowError('short')
  })
})
