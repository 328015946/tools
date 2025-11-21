/*
 * @Author: zengxiaobin
 * @Date: 2025-11-21 15:47:06
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 17:46:41
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
    },
    {
      id: 7,
      nameKey: 'uuid.title',
      descKey: 'uuid.desc',
      icon: '🆔',
      color: 'bg-indigo-100 text-indigo-600',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/uuid'
    },
    // 新增 2: URL (Dev)
    {
      id: 8,
      nameKey: 'url.title',
      descKey: 'url.desc',
      icon: '🔗',
      color: 'bg-cyan-100 text-cyan-600',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/url'
    },
    // 新增 3: QR Code (Image)
    {
      id: 9,
      nameKey: 'qrcode.title',
      descKey: 'qrcode.desc',
      icon: '📱',
      color: 'bg-gray-100 text-gray-800',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/qrcode'
    },
    {
      id: 10,
      nameKey: 'img_base64.title',
      descKey: 'img_base64.desc',
      icon: '🧬',
      color: 'bg-pink-100 text-pink-600',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/base64'
    },
    // 新增: 文本对比 (Dev 类 或 Text 类，这里放 Text 更合适)
    {
      id: 11,
      nameKey: 'diff.title',
      descKey: 'diff.desc',
      icon: '⚖️',
      color: 'bg-yellow-100 text-yellow-700',
      category: 'nav.text_tools',
      categorySlug: 'text',
      path: '/tools/text/diff'
    },
    {
      id: 12, // ID 递增
      nameKey: 'hash.title',
      descKey: 'hash.desc',
      icon: '#️⃣', // 或者 🔒
      color: 'bg-slate-100 text-slate-700',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/hash'
    },
     {
      id: 13,
      nameKey: 'pwd.title',
      descKey: 'pwd.desc',
      icon: '🔑',
      color: 'bg-red-100 text-red-600',
      category: 'nav.other_tools',
      categorySlug: 'other', // ✅ 新分类 slug
      path: '/tools/other/password'
    }
  ]

  return { tools }
}
