/**
 * 存储工具（替代 H5 的 localStorage）
 * 小程序使用 wx.getStorageSync / wx.setStorageSync
 */

const PREFIX = 'xj_'

export const storage = {
  get(key) {
    try {
      return uni.getStorageSync(PREFIX + key)
    } catch (e) {
      return null
    }
  },

  set(key, val) {
    try {
      uni.setStorageSync(PREFIX + key, typeof val === 'string' ? val : JSON.stringify(val))
    } catch (e) {
      console.warn('storage set failed', key, e)
    }
  },

  remove(key) {
    try {
      uni.removeStorageSync(PREFIX + key)
    } catch (e) {}
  },

  clear() {
    // 只清除玄机阁相关的key
    const keys = uni.getStorageInfoSync().keys || []
    keys.forEach(k => {
      if (k.startsWith(PREFIX)) uni.removeStorageSync(k)
    })
  }
}

export default storage
