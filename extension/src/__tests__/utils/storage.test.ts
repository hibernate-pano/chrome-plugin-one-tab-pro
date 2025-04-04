import { saveTabs, getTabs } from '@/utils/storage'

describe('Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('saveTabs', () => {
    it('should save tabs to chrome storage', async () => {
      const mockTabs = [
        { id: '1', title: 'Test Tab 1', url: 'https://test1.com' },
        { id: '2', title: 'Test Tab 2', url: 'https://test2.com' },
      ]

      await saveTabs(mockTabs)

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        tabs: mockTabs,
      })
    })
  })

  describe('getTabs', () => {
    it('should retrieve tabs from chrome storage', async () => {
      const mockTabs = [
        { id: '1', title: 'Test Tab 1', url: 'https://test1.com' },
      ]

      ;(chrome.storage.local.get as jest.Mock).mockImplementation((_, callback) => {
        callback({ tabs: mockTabs })
      })

      const tabs = await getTabs()
      expect(tabs).toEqual(mockTabs)
    })

    it('should return empty array if no tabs are stored', async () => {
      ;(chrome.storage.local.get as jest.Mock).mockImplementation((_, callback) => {
        callback({})
      })

      const tabs = await getTabs()
      expect(tabs).toEqual([])
    })
  })
}) 