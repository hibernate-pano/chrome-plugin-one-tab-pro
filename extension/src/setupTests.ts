import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// 添加 TextEncoder 和 TextDecoder 的 polyfill
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// 模拟 chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
} as any 