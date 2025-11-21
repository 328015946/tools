/*
 * @Author: zengxiaobin
 * @Date: 2025-11-21 13:49:06
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 16:36:28
 * @FilePath: \xiao-nuxt4\nuxt.config.ts
 * @Description: 注释
 */
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n' // 确保引入了模块
  ],
  nitro: {
    // 告诉 Nuxt 打包成 Cloudflare Pages 格式
    preset: 'cloudflare-pages'
  },

  i18n: {
    // 启用懒加载翻译文件（性能更好）
    lazy: true,
    // 翻译文件存放的文件夹（根目录下的 locales）
    langDir: 'locales',
    // 默认语言
    defaultLocale: 'zh',
    // 策略：'prefix_except_default' 表示默认语言不带前缀，其他语言带前缀 (如 /en/login)
    // 也可以用 'no_prefix' (URL不变化) 或 'prefix' (所有都带前缀)
    strategy: 'prefix_except_default',
    // 定义支持的语言
    locales: [
      { code: 'zh', iso: 'zh-CN', name: '简体中文', file: 'zh.json' },
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' }
    ],
    // 自动检测浏览器语言
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
