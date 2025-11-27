// app/constants/assets.ts

export const EDITOR_ASSETS = {
  // 1. 模版
  templates: [
    {
      id: 'promo',
      label: '促销海报',
      preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      data: {
        background: '#FFF1F2',
        objects: [
          { type: 'circle', fill: '#FDA4AF', radius: 100, left: 300, top: 300, opacity: 0.5 },
          {
            type: 'text',
            content: '年中\n大促',
            fontSize: 80,
            left: 300,
            top: 250,
            fill: '#BE123C',
            textAlign: 'center',
            fontWeight: 'bold'
          },
          { type: 'text', content: '全场 5 折起', fontSize: 30, left: 300, top: 400, fill: '#881337' }
        ]
      }
    },
    {
      id: 'hiring',
      label: '商务招聘',
      preview: 'linear-gradient(to top, #accbee 0%, #e7f0fd 100%)',
      data: {
        background: '#EFF6FF',
        objects: [
          { type: 'rect', fill: '#3B82F6', width: 600, height: 150, left: 300, top: 75 },
          {
            type: 'text',
            content: 'WE ARE HIRING',
            fontSize: 50,
            left: 300,
            top: 75,
            fill: '#FFFFFF',
            fontWeight: 'bold'
          },
          {
            type: 'text',
            content: '诚聘精英',
            fontSize: 60,
            left: 300,
            top: 300,
            fill: '#1E40AF',
            textAlign: 'center'
          },
          { type: 'rect', fill: '#1E3A8A', width: 200, height: 50, left: 300, top: 500, rx: 10, ry: 10 },
          { type: 'text', content: '加入我们', fontSize: 24, left: 300, top: 500, fill: '#FFFFFF' }
        ]
      }
    },
    {
      id: 'tech',
      label: '科技发布',
      preview: 'linear-gradient(120deg, #0f172a 0%, #334155 100%)',
      data: {
        background: '#0F172A',
        objects: [
          {
            type: 'rect',
            fill: '#38BDF8',
            width: 400,
            height: 400,
            left: 300,
            top: 300,
            opacity: 0.2,
            rx: 200,
            ry: 200
          },
          {
            type: 'text',
            content: 'FUTURE',
            fontSize: 100,
            left: 300,
            top: 250,
            fill: '#FFFFFF',
            fontWeight: 'bold',
            fontFamily: 'Arial'
          },
          { type: 'text', content: '2025 发布会', fontSize: 40, left: 300, top: 380, fill: '#94A3B8' }
        ]
      }
    },
    {
      id: 'quote',
      label: '每日金句',
      preview: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
      data: {
        background: '#111827',
        objects: [
          { type: 'text', content: '“', fontSize: 120, left: 100, top: 200, fill: '#F59E0B', fontFamily: 'serif' },
          {
            type: 'text',
            content: '保持热爱\n奔赴山海',
            fontSize: 50,
            left: 300,
            top: 350,
            fill: '#F3F4F6',
            textAlign: 'center',
            fontFamily: 'serif'
          },
          {
            type: 'text',
            content: '— DesignPro',
            fontSize: 20,
            left: 450,
            top: 500,
            fill: '#9CA3AF',
            fontStyle: 'italic'
          }
        ]
      }
    }
  ],

  // 2. 颜色 (含莫兰迪色)
  colors: [
    '#FFFFFF',
    '#000000',
    '#FCA5A5',
    '#FDBA74',
    '#FDE047',
    '#86EFAC',
    '#93C5FD',
    '#C4B5FD',
    '#9CA3AF',
    '#4B5563',
    '#1F2937',
    '#D4C4B7',
    '#A9B7C0',
    '#C6D6C8',
    '#E6C8C8',
    '#A29696'
  ],

  // 3. 元素 (形状 + 图标)
  elements: [
    // --- 基础形状 ---
    { type: 'shape', shape: 'rect', color: '#F87171' },
    { type: 'shape', shape: 'circle', color: '#60A5FA' },
    { type: 'shape', shape: 'triangle', color: '#34D399' },
    { type: 'shape', shape: 'star', color: '#F59E0B' }, // 五角星

    // --- 电商标签 ---
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/879/879757.png' }, // Sale
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png' }, // Cart
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/889/889140.png' }, // Gift

    // --- 社交互动 ---
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/2107/2107845.png' }, // Heart
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/1077/1077035.png' }, // Like
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' }, // YouTube
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png' }, // Ins

    // --- 装饰元素 ---
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/616/616490.png' }, // Crown
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/763/763812.png' }, // Fire
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' }, // Star
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png' }, // Arrow
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/740/740845.png' }, // Quote
    { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/1160/1160358.png' } // Check
  ],

  // 4. 文字预设
  text: [
    { type: 'text', content: '双击编辑标题', fontSize: 60, fontWeight: 'bold' },
    { type: 'text', content: '正文内容\n多行文本', fontSize: 24, fontWeight: 'normal' },
    { type: 'text', content: 'SALE', fontSize: 80, fontWeight: '900', fill: '#EF4444' },
    { type: 'text', content: 'Special Offer', fontSize: 40, fontWeight: 'bold', fontStyle: 'italic', fill: '#F59E0B' },
    { type: 'text', content: '123-456-7890', fontSize: 24, fontWeight: 'normal' },
    { type: 'text', content: 'www.website.com', fontSize: 20, fill: '#6B7280' }
  ]
}
