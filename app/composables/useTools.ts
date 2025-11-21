/*
 * @Author: zengxiaobin
 * @Date: 2025-11-21 15:47:06
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 15:47:15
 * @FilePath: \xiao-nuxt4\app\composables\useTools.ts
 * @Description: 注释
 */
// composables/useTools.ts
export const useTools = () => {
  const tools = [
    {
      id: 1,
      nameKey: 'tools.json_fmt',
      descKey: 'tools.json_desc',
      icon: '💾',
      color: 'bg-blue-100 text-blue-600',
      category: 'nav.dev_tools', // 注意这里的 key
      categorySlug: 'dev', // 新增：用于路由匹配 (dev, image, text)
      path: '/tools/dev/json'
    },
    {
      id: 2,
      nameKey: 'tools.base64',
      descKey: 'tools.base64_desc',
      icon: '🔤',
      color: 'bg-purple-100 text-purple-600',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/base64'
    },
    {
      id: 3,
      nameKey: 'tools.timestamp',
      descKey: 'tools.timestamp_desc',
      icon: '⏱️',
      color: 'bg-orange-100 text-orange-600',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/timestamp'
    },
    {
      id: 4,
      nameKey: 'tools.img_compress',
      descKey: 'tools.img_desc',
      icon: '🖼️',
      color: 'bg-pink-100 text-pink-600',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/compress'
    },
    {
      id: 5,
      nameKey: 'tools.word_count',
      descKey: 'tools.word_desc',
      icon: '📝',
      color: 'bg-green-100 text-green-600',
      category: 'nav.text_tools',
      categorySlug: 'text',
      path: '/tools/text/count'
    },
    {
      id: 6,
      nameKey: 'tools.markdown',
      descKey: 'tools.markdown_desc',
      icon: '👀',
      color: 'bg-gray-100 text-gray-600',
      category: 'nav.text_tools',
      categorySlug: 'text',
      path: '/tools/text/markdown'
    }
  ]

  return { tools }
}
