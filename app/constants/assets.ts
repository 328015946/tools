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
    {
      type: 'path',
      label: '心形',
      // 这个 viewBox 是专门配合下面这个路径的，能让它完美铺满格子
      viewBox: '152 238 460 400',
      path: 'M 272.70141,238.71731 C 206.46141,238.71731 152.70141,292.47731 152.70141,358.71731 C 152.70141,493.46231 288.63441,521.28731 381.26341,636.14131 C 473.89241,521.28731 609.82541,493.46231 609.82541,358.71731 C 609.82541,292.47731 556.06541,238.71731 489.82541,238.71731 C 441.77841,238.71731 400.42441,267.08731 381.26341,307.52131 C 362.10241,267.08731 320.74841,238.71731 272.70141,238.71731 z',
      fill: '#EF4444',
      width: 60, // 拖到画布上的大小
      height: 60
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
