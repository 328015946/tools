/*
 * @Author: zengxiaobin
 * @Date: 2025-11-21 15:47:06
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 14:41:49
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
    },
    {
      id: 14,
      nameKey: 'barcode.title',
      descKey: 'barcode.desc',
      icon: '🏷️', // 或者 🛒
      color: 'bg-blue-50 text-blue-600',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/barcode'
    },
    {
      id: 15,
      nameKey: 'shadow.title',
      descKey: 'shadow.desc',
      icon: '🌓',
      color: 'bg-indigo-100 text-indigo-600',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/shadow'
    },
    {
      id: 16,
      nameKey: 'jwt.title',
      descKey: 'jwt.desc',
      icon: '🛡️',
      color: 'bg-violet-100 text-violet-600',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/jwt'
    },
    {
      id: 17,
      nameKey: 'svgpath.title',
      descKey: 'svgpath.desc',
      icon: '✒️',
      color: 'bg-rose-100 text-rose-600',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/svgpath'
    },
    {
      id: 18,
      nameKey: 'svg_edit.title',
      descKey: 'svg_edit.desc',
      icon: '🎨',
      color: 'bg-orange-100 text-orange-600',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/svgedit'
    },
    {
      id: 19,
      nameKey: 'watermark.title',
      descKey: 'watermark.desc',
      icon: '🛡️',
      color: 'bg-cyan-100 text-cyan-600',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/watermark'
    },
    {
      id: 20,
      nameKey: 'converter.title',
      descKey: 'converter.desc',
      icon: '🔄',
      color: 'bg-teal-100 text-teal-600',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/converter'
    },
    {
      id: 21,
      nameKey: 'http.title',
      descKey: 'http.desc',
      icon: '🚀', // 或者 🌐
      color: 'bg-blue-100 text-blue-600',
      category: 'nav.other_tools',
      categorySlug: 'other',
      path: '/tools/other/http'
    },
    {
      id: 22,
      nameKey: 'mock.title',
      descKey: 'mock.desc',
      icon: '🎲',
      color: 'bg-fuchsia-100 text-fuchsia-600',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/mock'
    },
    {
      id: 23,
      nameKey: 'sql.title',
      descKey: 'sql.desc',
      icon: '🐘',
      color: 'bg-blue-100 text-blue-700',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/sql'
    },
    // 新增: Regex (Dev)
    {
      id: 24,
      nameKey: 'regex.title',
      descKey: 'regex.desc',
      icon: '🔍',
      color: 'bg-yellow-100 text-yellow-700',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/regex'
    },
    {
      id: 25,
      nameKey: 'gradient.title',
      descKey: 'gradient.desc',
      icon: '🌈',
      color: 'bg-fuchsia-100 text-fuchsia-600',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/gradient'
    },
    // 新增: 进制转换 (Dev 或 Other，这里放 Dev)
    {
      id: 26,
      nameKey: 'base.title',
      descKey: 'base.desc',
      icon: '🔢',
      color: 'bg-lime-100 text-lime-700',
      category: 'nav.dev_tools',
      categorySlug: 'dev',
      path: '/tools/dev/base'
    },
    // 27. 屏幕尺寸 (Other)
    {
      id: 27,
      nameKey: 'screen.title',
      descKey: 'screen.desc',
      icon: '📏',
      color: 'bg-blue-50 text-blue-600',
      category: 'nav.other_tools',
      categorySlug: 'other',
      path: '/tools/other/screen'
    },
    // 28. 社交预览 (Other)
    {
      id: 28,
      nameKey: 'social.title',
      descKey: 'social.desc',
      icon: '🎭',
      color: 'bg-indigo-50 text-indigo-600',
      category: 'nav.other_tools',
      categorySlug: 'other',
      path: '/tools/other/social'
    },
    // 29. 配色生成 (Other)
    {
      id: 29,
      nameKey: 'palette.title',
      descKey: 'palette.desc',
      icon: '🎨',
      color: 'bg-pink-50 text-pink-600',
      category: 'nav.other_tools',
      categorySlug: 'other',
      path: '/tools/other/palette'
    },
    // 30. 图片拼接 (Other)
    {
      id: 30,
      nameKey: 'joiner.title',
      descKey: 'joiner.desc',
      icon: '🖼️',
      color: 'bg-teal-50 text-teal-600',
      category: 'nav.other_tools',
      categorySlug: 'other',
      path: '/tools/other/joiner'
    },
    // 31. 占位图 (Other)
    {
      id: 31,
      nameKey: 'placeholder.title',
      descKey: 'placeholder.desc',
      icon: '🔲',
      color: 'bg-gray-100 text-gray-600',
      category: 'nav.other_tools',
      categorySlug: 'other',
      path: '/tools/other/placeholder'
    },
    {
      id: 32,
      nameKey: 'mermaid.title',
      descKey: 'mermaid.desc',
      icon: '🧜‍♀️',
      color: 'bg-violet-50 text-violet-600',
      category: 'nav.other_tools',
      categorySlug: 'other',
      path: '/tools/other/mermaid'
    },
    {
      id: 33,
      nameKey: 'editor.title',
      descKey: 'editor.desc',
      icon: '✨',
      color: 'bg-purple-100 text-purple-600',
      category: 'nav.image_tools',
      categorySlug: 'image',
      path: '/tools/image/editor'
    }
  ]

  return { tools }
}
