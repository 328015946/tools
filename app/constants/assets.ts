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
          { type: 'circle', fill: '#FDA4AF', radius: 100, left: 400, top: 300, opacity: 0.5 },
          {
            type: 'text',
            content: '年中\n大促',
            fontSize: 80,
            left: 400,
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
          { type: 'rect', fill: '#3B82F6', width: 600, height: 150, left: 400, top: 75 },
          {
            type: 'text',
            content: 'WE ARE HIRING',
            fontSize: 50,
            left: 400,
            top: 75,
            fill: '#FFFFFF',
            fontWeight: 'bold'
          },
          {
            type: 'text',
            content: '诚聘精英',
            fontSize: 60,
            left: 400,
            top: 300,
            fill: '#1E40AF',
            textAlign: 'center'
          },
          { type: 'rect', fill: '#1E3A8A', width: 200, height: 50, left: 400, top: 500, rx: 10, ry: 10 },
          { type: 'text', content: '加入我们', fontSize: 24, left: 400, top: 500, fill: '#FFFFFF' }
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
            left: 400,
            top: 300,
            opacity: 0.2,
            rx: 200,
            ry: 200
          },
          {
            type: 'text',
            content: 'FUTURE',
            fontSize: 100,
            left: 400,
            top: 250,
            fill: '#FFFFFF',
            fontWeight: 'bold',
            fontFamily: 'Arial'
          },
          { type: 'text', content: '2025 发布会', fontSize: 40, left: 400, top: 380, fill: '#94A3B8' }
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
            left: 400,
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
    // assets.ts -> elements 数组追加以下内容：

    // --- 🟢 常用 UI 图标 ---
    {
      type: 'path',
      label: '首页',
      // 标准房屋图标
      viewBox: '0 0 1024 1024',
      path: 'M946.5 505L534.6 93.4a31.93 31.93 0 0 0-45.2 0L77.5 505c-12 12-1.9 32.8 15 32.8h117.2V926c0 17.7 14.3 32 32 32h560c17.7 0 32-14.3 32-32V537.8h117.2c16.9 0 27-20.8 15-32.8z',
      fill: '#4B5563',
      width: 60
    },
    {
      type: 'path',
      label: '用户',
      // 个人/头像
      viewBox: '0 0 1024 1024',
      path: 'M858.5 763.6a374 374 0 0 0-80.6-119.5 375.63 375.63 0 0 0-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.6 80.6a375.63 375.63 0 0 0-80.6 119.5A371.7 371.7 0 0 0 136 901.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 0 0 8-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z',
      fill: '#4B5563',
      width: 60
    },
    {
      type: 'path',
      label: '设置',
      // 齿轮
      viewBox: '0 0 1024 1024',
      path: 'M924.8 625.7l-65.5-56c3.1-19 4.7-38.4 4.7-57.8s-1.6-38.8-4.7-57.8l65.5-56a32.03 32.03 0 0 0 9.3-35.2l-.9-2.6a443.74 443.74 0 0 0-79.7-137.9l-1.8-2.1a32.12 32.12 0 0 0-35.1-9.5l-81.3 28.9c-30-24.6-63.5-44-99.7-57.6l-15.7-85a32.05 32.05 0 0 0-25.8-25.7l-2.7-.5c-52.1-9.4-106.9-9.4-159 0l-2.7.5a32.05 32.05 0 0 0-25.8 25.7l-15.8 85.4a351.86 351.86 0 0 0-99 57.4l-81.9-29.1a32 32 0 0 0-35.1 9.5l-1.8 2.1a446.02 446.02 0 0 0-79.7 137.9l-.9 2.6c-4.5 12.5-.8 26.5 9.3 35.2l66.3 56.6c-3.1 18.8-4.6 38-4.6 57.1 0 19.2 1.5 38.4 4.6 57.1L99 625.5a32.03 32.03 0 0 0-9.3 35.2l.9 2.6c18.4 50.4 45.6 97.9 79.7 137.9l1.8 2.1a32.12 32.12 0 0 0 35.1 9.5l81.9-29.1c29.8 24.5 63.1 43.9 99 57.4l15.8 85.4a32.05 32.05 0 0 0 25.8 25.7l2.7.5a449.4 449.4 0 0 0 159 0l2.7-.5a32.05 32.05 0 0 0 25.8-25.7l15.7-85a350 350 0 0 0 99.7-57.6l81.3 28.9a32 32 0 0 0 35.1-9.5l1.8-2.1c34.1-40 61.3-87.5 79.7-137.9l.9-2.6c4.5-12.3.8-26.3-9.3-35zM512 714c-111.6 0-202-90.4-202-202s90.4-202 202-202 202 90.4 202 202-90.4 202-202 202z',
      fill: '#4B5563',
      width: 60
    },
    {
      type: 'path',
      label: '搜索',
      // 放大镜
      viewBox: '0 0 1024 1024',
      path: 'M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z',
      fill: '#4B5563',
      width: 60
    },

    // --- 🟢 交互与通讯 ---
    {
      type: 'path',
      label: '定位',
      // 地图图钉
      viewBox: '0 0 1024 1024',
      path: 'M512 928c23.9 0 46.1-12.7 58-33.1L824 446.3c16.3-28 16.3-62.6 0-90.6C795.5 306.9 738.6 220.5 656.7 163 596 120.4 535.4 96 512 96s-84 24.4-144.7 67c-81.9 57.5-138.8 143.9-167.3 192.7-16.3 28-16.3 62.6 0 90.6L454 894.9c11.9 20.4 34.1 33.1 58 33.1zM512 336c61.9 0 112 50.1 112 112s-50.1 112-112 112-112-50.1-112-112 50.1-112 112-112z',
      fill: '#EF4444', // 默认红色
      width: 50
    },
    {
      type: 'path',
      label: '喜欢',
      // 实心爱心 (比之前的更圆润)
      viewBox: '0 0 1024 1024',
      path: 'M923 283.6a260.04 260.04 0 0 0-56.9-82.8 264.4 264.4 0 0 0-84-55.5A265.34 265.34 0 0 0 679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 0 0-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z',
      fill: '#F87171',
      width: 60
    },
    {
      type: 'path',
      label: '邮件',
      // 信封
      viewBox: '0 0 1024 1024',
      path: 'M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-40 110.8V792H136V270.8l-27.6-21.5 39.3-50.5 42.8 33.3h643.1l42.8-33.3 39.3 50.5-27.7 21.5zM833.6 232L512 482 190.4 232h643.2z',
      fill: '#60A5FA',
      width: 60
    },
    {
      type: 'path',
      label: '购物车',
      // 电商购物车
      viewBox: '0 0 1024 1024',
      path: 'M922.9 701.9H327.4l29.9-60.9 496.8-.9c16.8 0 31.2-12 34.2-28.6l68.8-385.1c1.8-10.1-.9-20.5-7.5-28.4a34.99 34.99 0 0 0-26.6-12.5l-632-2.1-5.4-25.4c-3.4-16.2-18-28-34.6-28H96.5a35.3 35.3 0 1 0 0 70.6h125.9L246 312.8l58.1 281.3-43 53.1c-12.9 15.9-20.7 35.9-20.7 57.4 0 49.9 40.5 90.6 90.3 90.6 0 0 0 0 .1 0h592.1c19.5 0 35.4-15.9 35.4-35.4s-15.8-35.4-35.3-35.4H330.7c-10.9 0-19.8-8.9-19.8-19.9 0-3.6 1-7.1 2.8-10.2l14.2-17.5h571.5c18.3 0 33.6-13.8 35.2-32l23.5-128.8c3.5-19.1-11.2-36.5-25.2-36.5zM832 202l-586.7 2L223 93.6l635.3 2.1L832 202z',
      fill: '#F59E0B',
      width: 60
    },

    // --- 🟢 装饰与指示 ---
    {
      type: 'path',
      label: '对勾',
      // 完成/正确
      viewBox: '0 0 1024 1024',
      path: 'M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z',
      fill: '#10B981',
      width: 50
    },
    {
      type: 'path',
      label: '箭头',
      // 右箭头
      viewBox: '0 0 1024 1024',
      path: 'M869 487.8L491.2 159.9c-29.1-25.1-73.7-4.4-73.7 34.2V320H100c-17.7 0-32 14.3-32 32v128c0 17.7 14.3 32 32 32h317.5v125.8c0 38.6 44.6 59.3 73.7 34.2L869 544.2c15.1-13.1 15.1-43.3 0-56.4z',
      fill: '#6366F1',
      width: 60
    },
    {
      type: 'path',
      label: '关闭',
      // 错误/关闭
      viewBox: '0 0 1024 1024',
      path: 'M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 0 0 203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z',
      fill: '#EF4444',
      width: 50
    },

    // --- 🟢 社交媒体 (Facebook, Twitter, Ins) ---

    {
      type: 'path',
      label: 'Twitter',
      viewBox: '0 0 1024 1024',
      path: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm215.3 337.7c.3 4.7.3 9.6.3 14.4 0 146.8-111.8 315.9-316.1 315.9-63 0-121.4-18.3-170.6-49.8 9 1 17.6 1.4 26.8 1.4 52 0 99.8-17.6 137.9-47.4-48.8-1-89.8-33.1-104.1-77.5 7 1.3 14 2 21.6 2 10 0 19.9-1.3 29.2-3.8-51-10.2-89.4-55.1-89.4-108.9v-1.5c15.1 8.4 32.4 13.5 50.8 14.1-29.9-20-49.6-54.2-49.6-92.6 0-20.4 5.5-39.4 15.1-55.8 55.2 67.7 137.4 112.1 229.7 116.8-1.9-8.2-2.9-16.7-2.9-25.5 0-61.4 49.8-111.2 111.2-111.2 32.1 0 61.1 13.6 81.4 35.3 25.3-5 49.2-14.2 70.8-27-8.3 25.9-25.9 47.7-48.8 61.4 22.5-2.7 44-8.6 64.1-17.5-14.8 22.1-33.6 41.5-54.6 57.2z',
      fill: '#1DA1F2',
      width: 60
    },
    {
      type: 'path',
      label: 'Instagram',
      viewBox: '0 0 1024 1024',
      path: 'M512 306.9c-113.5 0-205.1 91.6-205.1 205.1S398.5 717.1 512 717.1 717.1 625.5 717.1 512 625.5 306.9 512 306.9zm0 338.4c-73.4 0-133.3-59.9-133.3-133.3S438.6 378.7 512 378.7 645.3 438.6 645.3 512 585.4 645.3 512 645.3zM785.4 286.2c0 26.5-21.5 47.9-47.9 47.9s-47.9-21.5-47.9-47.9 21.5-47.9 47.9-47.9 47.9 21.5 47.9 47.9zM928 512c0-112.7.5-227.1-4.2-311.6-4.9-88-59.5-157-147-161.7C693.3 34.3 512 34.3 512 34.3s-181.3 0-264.9 4.4c-87.5 4.7-142.1 73.7-147 161.7C95.5 284.9 96 399.3 96 512s-.5 227.1 4.2 311.6c4.9 88 59.5 157 147 161.7C330.7 989.7 512 989.7 512 989.7s181.3 0 264.9-4.4c87.5-4.7 142.1-73.7 147-161.7 4.7-84.5 4.1-198.9 4.1-311.6zm-76.3 302.2c-7.3 11-16 20.6-25.9 28.7-44.5 36.6-113.8 30.6-189.6 30.6H387.8c-75.8 0-145.1 6-189.6-30.6-9.9-8.1-18.6-17.7-25.9-28.7-23.7-35.8-17.7-109.8-17.7-302.2s-6-266.4 17.7-302.2c7.3-11 16-20.6 25.9-28.7 44.5-36.6 113.8-30.6 189.6-30.6h124.5c75.8 0 145.1-6 189.6 30.6 9.9 8.1 18.6 17.7 25.9 28.7 23.7 35.8 17.7 109.8 17.7 302.2s5.9 266.4-17.8 302.2z',
      fill: '#C13584',
      width: 60
    },
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
  ],
  // [新增] 复杂组件 (Components)
  components: [
    // 1. 三步流程 (修复坐标与间距)
    {
      id: 'step-process',
      label: '三步流程',
      preview: 'https://cdn-icons-png.flaticon.com/512/2736/2736006.png',
      type: 'component',
      children: [
        // === 步骤 1 (左) ===
        {
          type: 'path',
          // 箭头路径：宽约100，高60
          path: 'M 0 0 L 80 0 L 100 30 L 80 60 L 0 60 L 20 30 Z',
          left: -110, // 向左偏移
          top: 0,
          fill: '#FF6B6B',
          width: 100,
          height: 60
        },
        {
          type: 'text',
          content: 'Step 1',
          fontSize: 14,
          fontWeight: 'bold',
          left: -110, // 与箭头 left 一致
          top: 0, // 与箭头 top 一致，因为 originX/Y 都是 center
          fill: '#ffffff'
        },

        // === 步骤 2 (中) ===
        {
          type: 'path',
          path: 'M 0 0 L 80 0 L 100 30 L 80 60 L 0 60 L 20 30 Z',
          left: 0,
          top: 0,
          fill: '#FF9F43', // 橙色
          width: 100,
          height: 60
        },
        {
          type: 'text',
          content: 'Step 2',
          fontSize: 14,
          fontWeight: 'bold',
          left: 0,
          top: 0,
          fill: '#ffffff'
        },

        // === 步骤 3 (右) ===
        {
          type: 'path',
          path: 'M 0 0 L 80 0 L 100 30 L 80 60 L 0 60 L 20 30 Z',
          left: 110, // 向右偏移
          top: 0,
          fill: '#48DBFB', // 蓝色
          width: 100,
          height: 60
        },
        {
          type: 'text',
          content: 'Step 3',
          fontSize: 14,
          fontWeight: 'bold',
          left: 110,
          top: 0,
          fill: '#ffffff'
        }
      ]
    },

    // 2. 数据卡片 (修复对齐，增加阴影感)
    {
      id: 'stat-card',
      label: '数据卡片',
      preview: 'https://cdn-icons-png.flaticon.com/512/3063/3063835.png',
      type: 'component',
      children: [
        // 卡片背景
        {
          type: 'rect',
          width: 200,
          height: 120,
          rx: 12,
          ry: 12,
          fill: '#FFFFFF',
          left: 0,
          top: 0,
          // 模拟边框
          stroke: '#E5E7EB',
          strokeWidth: 1
        },
        // 顶部装饰条 (位于卡片内部上方)
        {
          type: 'rect',
          width: 200,
          height: 6,
          rx: 0,
          ry: 0,
          fill: '#6366F1', // Indigo
          left: 0,
          top: -57 // 120/2 - 3
        },
        // Label
        {
          type: 'text',
          content: '总销售额 (Total)',
          fontSize: 14,
          fill: '#9CA3AF',
          left: 0,
          top: -20
        },
        // Number
        {
          type: 'text',
          content: '¥ 12,888',
          fontSize: 32,
          fontWeight: 'bold',
          fill: '#111827',
          left: 0,
          top: 15
        },
        // 增长率 (绿色小字)
        {
          type: 'text',
          content: '▲ 12.5%',
          fontSize: 12,
          fill: '#10B981',
          left: 0,
          top: 40
        }
      ]
    },

    // 3. 环形进度 (视觉 Hack：两个圆叠加)
    {
      id: 'progress-ring',
      label: '进度环',
      preview: 'https://cdn-icons-png.flaticon.com/512/3106/3106090.png',
      type: 'component',
      children: [
        // 外圆 (背景色)
        {
          type: 'circle',
          radius: 60,
          fill: '#E0E7FF',
          left: 0,
          top: 0
        },
        // 进度扇形 (这里用一个半圆模拟，实际可以更复杂)
        // 简单起见，这里用一个稍微深色的圆代表"已完成"，实际项目可用 path 绘制弧形
        {
          type: 'circle',
          radius: 60,
          fill: '#6366F1',
          left: 0,
          top: 0
          // 利用 clipPath 或者简单的覆盖逻辑(Fabric 组合里 clipPath 较复杂，这里简化为全圆演示颜色)
          // 为了演示效果，我们改用一个不同颜色的圆环
        },
        // 内圆 (白色，遮住中间形成环)
        {
          type: 'circle',
          radius: 45,
          fill: '#FFFFFF',
          left: 0,
          top: 0
        },
        // 中心文字
        {
          type: 'text',
          content: '75%',
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#4F46E5',
          left: 0,
          top: 0
        }
      ]
    },

    // 4. 简易柱状图
    {
      id: 'bar-chart',
      label: '柱状图',
      preview: 'https://cdn-icons-png.flaticon.com/512/3094/3094851.png',
      type: 'component',
      children: [
        // 底部分隔线
        {
          type: 'rect',
          width: 160,
          height: 2,
          fill: '#D1D5DB',
          left: 0,
          top: 50
        },
        // 柱子 1 (矮)
        {
          type: 'rect',
          width: 30,
          height: 40,
          fill: '#93C5FD',
          left: -50,
          top: 30 // top = lineY(50) - height(40)/2 = 30
        },
        // 柱子 2 (高)
        {
          type: 'rect',
          width: 30,
          height: 80,
          fill: '#3B82F6',
          left: 0,
          top: 10 // top = 50 - 80/2 = 10
        },
        // 柱子 3 (中)
        {
          type: 'rect',
          width: 30,
          height: 60,
          fill: '#2563EB',
          left: 50,
          top: 20 // top = 50 - 60/2 = 20
        }
      ]
    },

    // 5. 个人名片/Profile
    {
      id: 'profile-card',
      label: '个人名片',
      preview: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
      type: 'component',
      children: [
        // 背景卡片
        {
          type: 'rect',
          width: 220,
          height: 140,
          rx: 16,
          ry: 16,
          fill: '#F9FAFB',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          left: 0,
          top: 10 // 稍微下移，给头像留出空间
        },
        // 头像 (圆形)
        {
          type: 'circle',
          radius: 35,
          fill: '#C7D2FE', // 淡紫
          stroke: '#FFFFFF',
          strokeWidth: 4,
          left: 0,
          top: -60 // 浮在卡片上方
        },
        // 姓名
        {
          type: 'text',
          content: 'Alex Designer',
          fontSize: 18,
          fontWeight: 'bold',
          fill: '#1F2937',
          left: 0,
          top: -10
        },
        // 职位
        {
          type: 'text',
          content: 'Product Manager',
          fontSize: 12,
          fill: '#6B7280',
          left: 0,
          top: 15
        },
        // 按钮
        {
          type: 'rect',
          width: 100,
          height: 30,
          rx: 15,
          ry: 15,
          fill: '#4F46E5',
          left: 0,
          top: 50
        },
        {
          type: 'text',
          content: 'Follow',
          fontSize: 12,
          fill: '#FFFFFF',
          left: 0,
          top: 50
        }
      ]
    },

    // 6. 大促标签
    {
      id: 'sale-badge',
      label: '大促标签',
      preview: 'https://cdn-icons-png.flaticon.com/512/2331/2331718.png',
      type: 'component',
      children: [
        // 星形背景 (用 Star shape 或者 Path)
        {
          type: 'shape', // 如果你的 addElement 逻辑里支持 shape: 'star'
          shape: 'star',
          width: 120, // 仅作参考，star 实际由 path 决定
          fill: '#EF4444',
          left: 0,
          top: 0
        },
        // 内圈装饰
        {
          type: 'circle',
          radius: 35,
          fill: 'transparent',
          stroke: '#FFFFFF',
          strokeWidth: 2,
          strokeDashArray: [4, 4], // 虚线
          left: 0,
          top: 0
        },
        {
          type: 'text',
          content: 'SALE',
          fontSize: 20,
          fontWeight: '900', // 特粗
          fill: '#FFFFFF',
          left: 0,
          top: -10,
          angle: -5 // 稍微倾斜
        },
        {
          type: 'text',
          content: '50% OFF',
          fontSize: 14,
          fontWeight: 'bold',
          fill: '#FFFFFF',
          left: 0,
          top: 12,
          angle: -5
        }
      ]
    },

    // 7. 任务/看板卡片
    {
      id: 'task-card',
      label: '任务卡片',
      preview: 'https://cdn-icons-png.flaticon.com/512/889/889965.png',
      type: 'component',
      children: [
        // 背景
        {
          type: 'rect',
          width: 240,
          height: 80,
          rx: 8,
          ry: 8,
          fill: '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          left: 0,
          top: 0,
          shadow: { color: 'rgba(0,0,0,0.05)', blur: 10, offsetX: 0, offsetY: 4 }
        },
        // 状态条 (左侧)
        {
          type: 'rect',
          width: 6,
          height: 80,
          rx: 0, // 左边直角，还是圆角看喜好
          ry: 0,
          fill: '#F59E0B', // 黄色状态
          left: -117, // -120 + 3
          top: 0
        },
        // 标题
        {
          type: 'text',
          content: '完成首页设计稿',
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#374151',
          left: -30, // 稍微靠左
          top: -15,
          textAlign: 'left',
          originX: 'left' // 注意：如果你的 createFabricObject 强制设了 center，这里可能要微调 left
        },
        // 标签 (Design)
        {
          type: 'rect',
          width: 60,
          height: 20,
          rx: 4,
          ry: 4,
          fill: '#EEF2FF',
          left: -80,
          top: 15
        },
        {
          type: 'text',
          content: 'Design',
          fontSize: 10,
          fill: '#4F46E5',
          left: -80,
          top: 15
        },
        // 截止日期
        {
          type: 'text',
          content: '明日截止',
          fontSize: 10,
          fill: '#EF4444',
          left: 60,
          top: 15
        }
      ]
    }
  ]
}
