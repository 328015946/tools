<script setup lang="ts">
  import { ref, watch } from 'vue'
  import LayerItem from './LayerItem.vue' // [新增] 引入组件
  import QRCode from 'qrcode' // [新增] 引入库
  // [新增] 接收 layers 和 activeObject
  const props = defineProps<{
    assets: any
    layers?: any[] // 可选，防止旧代码报错
    activeObject?: any
    isPenMode?: boolean // 新增
  }>()

  const emit = defineEmits([
    'add-element',
    'apply-template',
    'upload-image',
    'set-bg-color',
    'set-drawing-mode',
    'set-brush-color',
    'set-brush-width',
    // [新增]
    'select-layer',
    'toggle-layer-visible',
    'toggle-layer-lock',
    'reorder-layer', // [新增] 排序事件
    'toggle-group-expand', // [新增] 折叠事件
    'toggle-pen-mode' // 新增事件
  ])
  // 1. 定义菜单配置 (集中管理 Icon、名称、侧边栏标题)
  const menus = [
    { key: 'templates', icon: '🎨', label: '背景', title: '背景设置' },
    { key: 'elements', icon: '🧩', label: '素材', title: '添加素材' },
    { key: 'components', icon: '📦', label: '组件', title: '图表组件' },
    { key: 'text', icon: 'T', label: '文字', title: '添加文字' },
    { key: 'icons', icon: '⭐', label: '图标', title: '矢量图标库' }, // 🟢 [新增]
    { key: 'qrcode', icon: '📱', label: '二维码', title: '生成二维码' }, // 🟢 [新增]
    { key: 'draw', icon: '🖊️', label: '画笔', title: '自由绘制' },
    { key: 'upload', icon: '☁️', label: '上传', title: '本地上传' }
  ]

  // 类型定义自动推导，或者手动指定
  type TabType = 'templates' | 'elements' | 'components' | 'text' | 'draw' | 'upload' | 'layers'

  const activeTab = ref<'templates' | 'elements' | 'components' | 'icons' | 'text' | 'upload' | 'draw' | 'layers'>(
    'elements'
  )
  const fileInput = ref<HTMLInputElement | null>(null)
  // 2. [优化] 使用 computed 计算当前侧边栏标题
  // 不再需要在模板里写一堆 if-else
  const currentTitle = computed(() => {
    if (activeTab.value === 'layers') return '图层管理'
    const currentMenu = menus.find(m => m.key === activeTab.value)
    return currentMenu ? currentMenu.title : '属性设置'
  })

  // 🟢 [新增] 背景面板的状态
  const bgMode = ref<'solid' | 'gradient'>('solid') // 背景模式：纯色/渐变

  // 自定义纯色
  const customColor = ref('#ffffff')

  // 自定义渐变
  const gradientState = ref({
    color1: '#ffffff', // 起始色
    color2: '#4f46e5', // 结束色
    angle: 90 // 角度
  })

  // 预设渐变列表
  const presetGradients = [
    { label: '落日', c1: '#fa709a', c2: '#fee140', angle: 0 },
    { label: '海洋', c1: '#4facfe', c2: '#00f2fe', angle: 0 },
    { label: '极光', c1: '#a18cd1', c2: '#fbc2eb', angle: 0 },
    { label: '森林', c1: '#84fab0', c2: '#8fd3f4', angle: 0 },
    { label: '暗夜', c1: '#434343', c2: '#000000', angle: 0 },
    { label: '钛白', c1: '#e0c3fc', c2: '#8ec5fc', angle: 0 }
  ]

  // 监听自定义颜色变化，实时应用
  const applyCustomColor = () => {
    emit('set-bg-color', customColor.value)
  }

  // 🟢 [核心] 生成并应用渐变
  const applyGradient = (preset?: any) => {
    // 如果传入了预设，先更新状态
    if (preset) {
      gradientState.value.color1 = preset.c1
      gradientState.value.color2 = preset.c2
      gradientState.value.angle = preset.angle || 90
    }

    // 发送渐变配置对象给父组件
    // 我们不在这里生成 fabric.Gradient，而是把参数传过去，让父组件处理
    emit('set-bg-color', {
      type: 'gradient',
      start: gradientState.value.color1,
      end: gradientState.value.color2,
      angle: gradientState.value.angle
    })
  }

  const handlePresetColor = (color: string) => {
    emit('set-bg-color', color)
    customColor.value = color
  }
  // --- 拖拽排序逻辑 ---
  const dragOverId = ref<string | null>(null)
  const dragPosition = ref<'top' | 'bottom' | null>(null) // 指示线位置

  // 开始拖拽
  const onDragStart = (data: any) => {
    // 记录正在拖拽的数据
    // dataTransfer.setData...
  }

  // 拖拽悬停
  const onDragOver = (e: DragEvent) => {
    const target = (e.target as HTMLElement).closest('.layer-node')
    if (!target) return

    // 计算鼠标在目标元素的上半部还是下半部
    const rect = target.getBoundingClientRect()
    const offset = e.clientY - rect.top
    if (offset < rect.height / 2) {
      dragPosition.value = 'top'
    } else {
      dragPosition.value = 'bottom'
    }
  }

  // 放置
  const onDropItem = ({ targetId, targetItem }: any) => {
    // 获取正在拖拽的元素ID（这里简化处理，实际可以通过 dataTransfer 或全局变量传）
    // 为了简单，我们让 LayerItem 把 drag-start 传出的 item 暂存一下，或者让 Parent 处理
    // 最佳实践：emit 完整的事件
    emit('reorder-layer', {
      targetId,
      position: dragPosition.value
    })

    // 重置状态
    dragOverId.value = null
    dragPosition.value = null
  }

  // 暂存被拖拽的ID
  const draggingId = ref<string | null>(null)
  const handleLayerDragStart = (info: any) => {
    draggingId.value = info.id
  }

  const handleLayerDrop = (info: any) => {
    if (!draggingId.value || draggingId.value === info.targetId) return

    emit('reorder-layer', {
      dragId: draggingId.value,
      targetId: info.targetId,
      position: dragPosition.value
    })

    draggingId.value = null
    dragPosition.value = null
  }

  // --- 画笔状态 ---
  const isDrawing = ref(false)
  const brushColor = ref('#000000')
  const brushWidth = ref(5)
  // 🟢 [新增] 图标相关状态
  const iconQuery = ref('') // 搜索关键词
  const iconList = ref<any[]>([]) // 搜索结果
  const isSearchingIcons = ref(false)

  // 🟢 [新增] 搜索图标函数
  const searchIcons = async () => {
    if (!iconQuery.value) return

    isSearchingIcons.value = true
    try {
      // 调用 Iconify 官方搜索接口 (limit=50 限制数量)
      const res = await fetch(`https://api.iconify.design/search?query=${iconQuery.value}&limit=60`)
      const data = await res.json()

      // 处理数据：Iconify 返回的是 icon 名称 (如 "mdi:home")
      // 我们需要拼接成 SVG 图片地址
      if (data.icons) {
        iconList.value = data.icons.map((name: string) => {
          return {
            type: 'svg', // 标记为 svg 类型
            // Iconify SVG 直链格式: https://api.iconify.design/{prefix}/{name}.svg
            url: `https://api.iconify.design/${name.replace(':', '/')}.svg`,
            label: name
          }
        })
      }
    } catch (e) {
      console.error('搜索失败', e)
    } finally {
      isSearchingIcons.value = false
    }
  }

  // 🟢 [新增] 初始化加载一些热门图标 (可选)
  const loadHotIcons = () => {
    iconQuery.value = 'arrow' // 默认搜个箭头
    searchIcons()
  }
  // 监听画笔设置
  watch(isDrawing, val => emit('set-drawing-mode', val))
  watch(brushColor, val => emit('set-brush-color', val))
  watch(brushWidth, val => emit('set-brush-width', parseInt(val as any)))

  // 监听 Tab 切换：进画笔Tab自动开，出Tab自动关
  watch(activeTab, newTab => {
    if (newTab === 'icons' && iconList.value.length === 0) {
      loadHotIcons()
    }
    if (newTab === 'draw') {
      isDrawing.value = true
    } else {
      isDrawing.value = false
    }
  })
  // [新增] 开始拖拽处理函数
  const handleDragStart = (e: DragEvent, item: any) => {
    if (e.dataTransfer) {
      // 告诉浏览器这是一次“复制”操作
      e.dataTransfer.effectAllowed = 'copy'
      // 将要添加的元素数据序列化存入
      e.dataTransfer.setData('design-item', JSON.stringify(item))

      // 可以在这里设置拖拽时的幻影图片（可选，默认是元素截图）
    }
  }
  const handleUpload = (e: Event) => {
    const input = e.target as HTMLInputElement
    if (input.files?.[0]) {
      emit('upload-image', input.files[0])
      input.value = ''
    }
  }

  // 2. [新增] 二维码相关逻辑
  const qrText = ref('https://www.google.com') // 默认内容
  const qrColor = ref('#000000') // 前景色
  const qrBgColor = ref('#ffffff') // 背景色 (透明可以用 null 或 rgba)

  // 生成并添加到画布
  const addQRCode = async () => {
    if (!qrText.value) return

    try {
      // 生成高分辨率的 Base64 图片
      const dataUrl = await QRCode.toDataURL(qrText.value, {
        width: 400, // 足够清晰的宽度
        margin: 1,
        color: {
          dark: qrColor.value,
          light: qrBgColor.value // 如果想要透明背景，这里可以设为 null，但有些扫码器识别率会下降
        }
      })

      // 复用现有的 add-element 事件，当作普通图片处理
      emit('add-element', {
        type: 'image',
        url: dataUrl,
        // 可以传一些初始参数，比如不需要太大
        width: 200
      })
    } catch (err) {
      console.error(err)
    }
  }
  // 🟢 [新增] 点击标签搜索图标
  const handleTagClick = (tag: string) => {
    iconQuery.value = tag
    searchIcons()
  }
</script>

<template>
  <div class="flex h-full border-r border-gray-200 bg-white z-10">
    <!-- 1. 一级导航 -->
    <nav class="w-16 flex flex-col items-center py-4 gap-6 border-r border-gray-100 shrink-0">
      <button
        v-for="menu in menus"
        :key="menu.key"
        @click="activeTab = menu.key as any"
        class="flex flex-col items-center gap-1 p-2 rounded-lg transition w-12"
        :class="activeTab === menu.key ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900'">
        <span class="text-xl capitalize">{{ menu.icon }}</span>
        <span class="text-[10px]">{{ menu.label }}</span>
      </button>

      <!-- 图层按钮 (单独保留，因为它在 UI 逻辑上常驻底部或特殊处理) -->
      <button
        @click="activeTab = 'layers'"
        class="flex flex-col items-center gap-1 p-2 rounded-lg transition w-12"
        :class="activeTab === 'layers' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900'">
        <span class="text-xl">📑</span>
        <span class="text-[10px]">图层</span>
      </button>
    </nav>

    <!-- 2. 二级抽屉 -->
    <aside class="w-64 flex flex-col">
      <div class="p-4 border-b border-gray-100">
        <h2 class="font-bold text-gray-800 text-lg">
          {{ currentTitle }}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <!-- === 1. 画笔面板 (新功能) === -->
        <div v-if="activeTab === 'draw'" class="space-y-6">
          <!-- 开关 -->
          <div
            @click="isDrawing = !isDrawing"
            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition select-none"
            :class="isDrawing ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🖌️</span>
              <div class="flex flex-col">
                <span class="text-sm font-bold" :class="isDrawing ? 'text-indigo-700' : 'text-gray-700'">启用画笔</span>
                <span class="text-[10px] text-gray-500">{{ isDrawing ? '点击画布即可绘画' : '点击此处开启' }}</span>
              </div>
            </div>
            <div
              class="w-10 h-5 rounded-full relative transition-colors"
              :class="isDrawing ? 'bg-indigo-500' : 'bg-gray-300'">
              <div
                class="absolute top-1 w-3 h-3 bg-white rounded-full transition-all"
                :class="isDrawing ? 'left-6' : 'left-1'"></div>
            </div>
          </div>
          <div class="border-t border-gray-100 pt-4">
            <h3 class="text-xs font-bold text-gray-400 mb-2 uppercase">矢量绘图</h3>

            <!-- 🟢 [新增] 钢笔/多边形工具按钮 -->
            <button
              @click="$emit('toggle-pen-mode')"
              class="w-full py-3 rounded-lg border flex items-center justify-center gap-3 transition select-none group active:scale-95"
              :class="
                isPenMode
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              ">
              <span class="text-lg">✒️</span>
              <span class="text-sm font-medium">钢笔 / 多边形工具</span>
            </button>

            <p class="text-[10px] text-gray-400 mt-2 leading-relaxed">
              操作指南：<br />
              1. 点击画布确定顶点<br />
              2. 移动鼠标预览线条<br />
              3. <span class="font-bold text-gray-600">双击鼠标</span> 或按
              <span class="font-bold text-gray-600">Enter</span> 完成绘制
            </p>
          </div>
          <!-- 颜色 -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase">笔触颜色</label>
            <div class="flex gap-2 flex-wrap">
              <div
                v-for="c in ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']"
                :key="c"
                @click="brushColor = c"
                class="w-8 h-8 rounded-full cursor-pointer border hover:scale-110 transition shadow-sm"
                :class="{ 'ring-2 ring-indigo-500 ring-offset-2': brushColor === c }"
                :style="{ backgroundColor: c }"></div>
              <label
                class="w-8 h-8 rounded-full cursor-pointer border bg-white flex items-center justify-center hover:bg-gray-50 relative overflow-hidden">
                <span class="text-xs">➕</span>
                <input type="color" v-model="brushColor" class="absolute inset-0 opacity-0 cursor-pointer" />
              </label>
            </div>
          </div>

          <!-- 粗细 -->
          <div class="space-y-2">
            <div class="flex justify-between">
              <label class="text-xs font-bold text-gray-400 uppercase">笔触粗细</label>
              <span class="text-xs font-mono text-gray-500">{{ brushWidth }}px</span>
            </div>
            <input
              type="range"
              v-model="brushWidth"
              min="1"
              max="50"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            <!-- 粗细预览 -->
            <div class="h-12 border border-gray-100 rounded-lg bg-gray-50 flex items-center justify-center mt-2">
              <div
                class="rounded-full bg-gray-800 transition-all"
                :style="{ width: brushWidth + 'px', height: brushWidth + 'px', backgroundColor: brushColor }"></div>
            </div>
          </div>
        </div>

        <!-- === 2. 背景模版 (已恢复原样) === -->
        <!-- === 2. 背景设置 (升级版) === -->
        <div v-if="activeTab === 'templates'" class="space-y-6">
          <!-- 顶部切换：纯色 / 渐变 -->
          <div class="flex p-1 bg-gray-100 rounded-lg">
            <button
              @click="bgMode = 'solid'"
              class="flex-1 py-1.5 text-xs font-medium rounded-md transition"
              :class="bgMode === 'solid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'">
              纯色填充
            </button>
            <button
              @click="bgMode = 'gradient'"
              class="flex-1 py-1.5 text-xs font-medium rounded-md transition"
              :class="
                bgMode === 'gradient' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              ">
              渐变填充
            </button>
          </div>

          <!-- 🎨 模式 A: 纯色 -->
          <div v-if="bgMode === 'solid'" class="space-y-4">
            <!-- 自定义选色器 -->
            <div>
              <h3 class="text-xs font-bold text-gray-400 mb-2 uppercase">自定义颜色</h3>
              <div class="flex items-center gap-3">
                <div class="relative w-10 h-10 rounded-full border shadow-sm overflow-hidden group cursor-pointer">
                  <!-- 原生取色器 (透明覆盖) -->
                  <input
                    type="color"
                    v-model="customColor"
                    @input="applyCustomColor"
                    class="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer p-0 border-0" />
                  <!-- 显示当前颜色的环 -->
                  <div class="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-full"></div>
                </div>
                <div class="flex-1">
                  <input
                    type="text"
                    v-model="customColor"
                    @change="applyCustomColor"
                    class="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>

            <!-- 预设颜色 -->
            <div>
              <h3 class="text-xs font-bold text-gray-400 mb-2 uppercase">推荐颜色</h3>
              <div class="grid grid-cols-5 gap-2">
                <!-- 透明背景选项 -->
                <div
                  @click="emit('set-bg-color', 'transparent')"
                  title="透明背景"
                  class="w-full aspect-square rounded-full cursor-pointer border border-gray-200 hover:scale-110 transition flex items-center justify-center bg-gray-50 overflow-hidden">
                  <span class="text-[10px] text-gray-400">🚫</span>
                </div>
                <!-- 颜色列表 -->
                <div
                  v-for="color in assets.colors"
                  :key="color"
                  @click="handlePresetColor(color)"
                  class="w-full aspect-square rounded-full cursor-pointer border border-gray-100 hover:scale-110 transition shadow-sm"
                  :style="{ backgroundColor: color }"></div>
              </div>
            </div>
          </div>

          <!-- 🌈 模式 B: 渐变 -->
          <div v-if="bgMode === 'gradient'" class="space-y-5">
            <!-- 渐变生成器 -->
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-gray-500">起始色</span>
                <input
                  type="color"
                  v-model="gradientState.color1"
                  @input="applyGradient()"
                  class="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer" />
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-gray-500">结束色</span>
                <input
                  type="color"
                  v-model="gradientState.color2"
                  @input="applyGradient()"
                  class="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer" />
              </div>

              <!-- 角度滑块 -->
              <div class="pt-2">
                <div class="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>角度: {{ gradientState.angle }}°</span>
                </div>
                <input
                  type="range"
                  v-model.number="gradientState.angle"
                  min="0"
                  max="360"
                  step="45"
                  @input="applyGradient()"
                  class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>
            </div>

            <!-- 预设渐变 -->
            <div>
              <h3 class="text-xs font-bold text-gray-400 mb-2 uppercase">推荐渐变</h3>
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="(grad, idx) in presetGradients"
                  :key="idx"
                  @click="applyGradient(grad)"
                  class="h-10 rounded-md cursor-pointer border border-transparent hover:border-indigo-300 transition shadow-sm relative group"
                  :style="{ background: `linear-gradient(to right, ${grad.c1}, ${grad.c2})` }">
                  <span
                    class="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                    {{ grad.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 模版列表 (保留) -->
          <div class="pt-4 border-t border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 mb-2 uppercase">复杂背景模版</h3>
            <!-- ... 这里放原来的 assets.templates 循环 ... -->
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="tpl in assets.templates"
                :key="tpl.id"
                @click="emit('apply-template', tpl)"
                class="aspect-[2/3] rounded-lg cursor-pointer border hover:shadow-md transition overflow-hidden relative">
                <div class="w-full h-full" :style="{ background: tpl.preview }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- === 3. 素材元素 (已恢复原样) === -->
        <div v-if="activeTab === 'elements'" class="grid grid-cols-2 gap-3">
          <div
            v-for="(item, idx) in assets.elements"
            :key="idx"
            draggable="true"
            @dragstart="e => handleDragStart(e, item)"
            @click="emit('add-element', item)"
            class="aspect-square bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer border border-transparent hover:border-indigo-200 transition group">
            <!-- 恢复了形状判断逻辑 -->
            <div
              v-if="item.type === 'shape'"
              :style="{ backgroundColor: item.color }"
              class="w-10 h-10 shadow-sm transition-transform group-hover:scale-110"
              :class="
                item.shape === 'circle'
                  ? 'rounded-full'
                  : item.shape === 'triangle'
                  ? 'clip-triangle'
                  : item.shape === 'star'
                  ? 'clip-star'
                  : 'rounded-sm'
              "></div>
            <svg
              v-else-if="item.type === 'path'"
              :viewBox="item.viewBox || '0 0 1024 1024'"
              class="w-10 h-10 transition-transform group-hover:scale-110"
              :style="{ fill: item.fill || item.color || '#000' }"
              preserveAspectRatio="xMidYMid meet">
              <!-- preserveAspectRatio="xMidYMid meet" 意思是：无论比例如何，强制居中并完整显示 -->
              <path :d="item.path" />
            </svg>
            <img v-else :src="item.url" class="w-12 h-12 object-contain transition-transform group-hover:scale-110" />
          </div>
        </div>
        <!-- 🟢 [新增] 组件列表 -->
        <div v-if="activeTab === 'components'" class="grid grid-cols-2 gap-3">
          <div
            v-for="comp in assets.components"
            :key="comp.id"
            draggable="true"
            @dragstart="e => handleDragStart(e, comp)"
            @click="emit('add-element', comp)"
            class="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 cursor-pointer border border-transparent hover:border-indigo-200 transition group flex flex-col items-center gap-2">
            <!-- 预览图 -->
            <img :src="comp.preview" class="w-full h-20 object-contain" />
            <span class="text-xs text-gray-500 font-medium">{{ comp.label }}</span>
          </div>
        </div>
        <!-- ... 上面是 components ... -->

        <!-- 🟢 [新增] 矢量图标面板 -->
        <div v-if="activeTab === 'icons'" class="space-y-4 h-full flex flex-col">
          <!-- 搜索框 -->
          <div class="flex gap-2">
            <input
              v-model="iconQuery"
              @keyup.enter="searchIcons"
              type="text"
              placeholder="搜索图标 (如: phone, wechat)..."
              class="flex-1 text-xs border border-gray-200 rounded px-2 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50" />
            <button
              @click="searchIcons"
              class="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition">
              🔍
            </button>
          </div>

          <!-- 推荐标签 (可选) -->
          <div class="flex flex-wrap gap-1">
            <span
              v-for="tag in ['arrow', 'home', 'user', 'star', 'check', 'close']"
              :key="tag"
              @click="handleTagClick(tag)"
              class="px-2 py-1 bg-gray-100 text-[10px] text-gray-500 rounded-full cursor-pointer hover:bg-gray-200">
              {{ tag }}
            </span>
          </div>

          <!-- 列表区域 -->
          <div class="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
            <div v-if="isSearchingIcons" class="text-center py-10 text-gray-400 text-xs">加载中...</div>

            <div v-else-if="iconList.length === 0" class="text-center py-10 text-gray-400 text-xs">
              输入关键词搜索图标
            </div>

            <div v-else class="grid grid-cols-4 gap-2">
              <div
                v-for="(item, idx) in iconList"
                :key="idx"
                draggable="true"
                @dragstart="e => handleDragStart(e, item)"
                @click="emit('add-element', item)"
                class="aspect-square bg-gray-50 hover:bg-indigo-50 rounded p-1 cursor-pointer border border-transparent hover:border-indigo-200 transition flex items-center justify-center group"
                :title="item.label">
                <!-- 直接用 img 标签预览 SVG -->
                <img
                  :src="item.url"
                  class="w-6 h-6 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        <!-- ... 下面是 text ... -->
        <!-- === 4. 文字 (已恢复原样) === -->
        <div v-if="activeTab === 'text'" class="space-y-3">
          <div
            v-for="(item, idx) in assets.text"
            :key="idx"
            draggable="true"
            @dragstart="e => handleDragStart(e, item)"
            @click="emit('add-element', item)"
            class="bg-gray-50 hover:bg-indigo-50 border hover:border-indigo-200 rounded p-4 cursor-pointer transition text-center">
            <span :style="{ fontSize: item.fontSize > 30 ? '24px' : '16px', fontWeight: item.fontWeight }">{{
              item.content
            }}</span>
          </div>
        </div>
        <!-- === 🟢 [新增] 二维码面板 === -->
        <div v-if="activeTab === 'qrcode'" class="space-y-6 animate-fade-in">
          <!-- 输入框 -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase">链接 / 文本</label>
            <textarea
              v-model="qrText"
              rows="4"
              placeholder="输入网址或文本..."
              class="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-gray-50"></textarea>
          </div>

          <!-- 颜色设置 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase">前景色</label>
              <div class="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
                <input
                  type="color"
                  v-model="qrColor"
                  class="w-6 h-6 border-none bg-transparent cursor-pointer p-0 rounded overflow-hidden" />
                <span class="text-xs text-gray-500 font-mono">{{ qrColor }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-400 uppercase">背景色</label>
              <div class="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
                <input
                  type="color"
                  v-model="qrBgColor"
                  class="w-6 h-6 border-none bg-transparent cursor-pointer p-0 rounded overflow-hidden" />
                <span class="text-xs text-gray-500 font-mono">{{ qrBgColor }}</span>
              </div>
            </div>
          </div>

          <!-- 生成按钮 -->
          <button
            @click="addQRCode"
            class="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center gap-2">
            <span class="text-lg">✨</span> 生成到画布
          </button>

          <!-- 小提示 -->
          <div class="bg-blue-50 text-blue-600 p-3 rounded-lg text-xs leading-relaxed border border-blue-100">
            💡 提示：生成后，您可以像编辑普通图片一样调整它的大小、圆角或添加阴影。
          </div>
        </div>
        <!-- === 5. 上传 === -->
        <div
          v-if="activeTab === 'upload'"
          class="flex flex-col items-center justify-center h-64 bg-gray-50 rounded border-2 border-dashed">
          <button @click="fileInput?.click()" class="bg-indigo-600 text-white px-4 py-2 rounded">选择图片</button>
          <input type="file" ref="fileInput" @change="handleUpload" hidden />
        </div>
        <!-- === 图层管理 (修改后) === -->
        <div v-if="activeTab === 'layers'" class="space-y-1">
          <div v-if="!layers || layers.length === 0" class="text-center text-gray-400 py-10 text-sm">
            画布空空如也 🍃
          </div>

          <!-- 使用递归组件 -->
          <LayerItem
            v-for="(layer, idx) in layers"
            :key="layer.id"
            :item="layer"
            :depth="0"
            :index="idx"
            :active-id="activeObject?.id"
            @select="emit('select-layer', $event)"
            @toggle-visible="emit('toggle-layer-visible', $event)"
            @toggle-lock="emit('toggle-layer-lock', $event)"
            @toggle-expand="emit('toggle-group-expand', $event)"
            @drag-start="handleLayerDragStart"
            @drag-over="onDragOver"
            @drop-item="handleLayerDrop" />
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
  /* 别忘了这个三角形的样式 */
  .clip-triangle {
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  }
  /* [新增] 五角星裁剪路径 */
  .clip-star {
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  }
</style>
