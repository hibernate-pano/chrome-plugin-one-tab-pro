import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestClient } from 'hono/testing'
import { app } from '../../index'
import { prisma } from '../../lib/prisma'

const client = createTestClient(app)

describe('Auth API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  describe('POST /auth/wechat/login', () => {
    it('should return 400 if code is missing', async () => {
      const res = await client.auth.wechat.login.$post()
      expect(res.status).toBe(400)
    })

    it('should create new user and return token for valid code', async () => {
      const mockWechatResponse = {
        openid: 'test-openid',
        access_token: 'test-token',
      }

      vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockWechatResponse),
        } as Response)
      )

      const res = await client.auth.wechat.login.$post({
        json: { code: 'test-code' },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('token')
      expect(data).toHaveProperty('user')
    })
  })
}) 