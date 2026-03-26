<template>
  <div class="h-[calc(100vh)] flex flex-col bg-[#151515]">
    <!-- 顶部栏 -->
    <div class="h-16 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-4 sm:px-6 z-20">
      <div class="flex items-center gap-4">
        <!-- 左侧：Logo 和标题 -->
        <div class="flex items-center gap-2 text-gray-300">
          <span class="text-xl">✨</span>
          <h1 class="font-bold text-lg hidden sm:block">{{ $t('editor.title') }}</h1>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- 加载图片按钮 (顶部保留一个) -->
        <label
          class="cursor-pointer bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded text-sm font-medium transition border border-[#555] flex items-center gap-2">
          <span>📂</span>
          <span class="hidden sm:inline">{{ $t('editor.load_image') }}</span>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileChange" />
        </label>

        <!-- 下载按钮 -->
        <button
          @click="saveImage"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded text-sm font-bold transition shadow-lg shadow-emerald-900/20 flex items-center gap-2">
          <span>💾</span>
          <span class="hidden sm:inline">{{ $t('editor.download') }}</span>
        </button>

        <div class="w-px h-6 bg-[#444] mx-2"></div>

        <!-- ❌ 关闭/退出按钮 -->
        <button
          @click="closeEditor"
          class="text-gray-400 hover:text-red-500 transition p-2 rounded-full hover:bg-[#333]"
          title="Close / Exit">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 编辑器核心区域 -->
    <div class="flex-grow relative overflow-hidden group">
      <!-- TUI Editor 容器 -->
      <ClientOnly>
        <div id="tui-image-editor-container" class="w-full h-full"></div>
      </ClientOnly>

      <!-- ✅ 空状态遮罩 / 点击上传区 -->
      <!-- 当 hasImage 为 false 时显示。点击这里也会触发 input click -->
      <div
        v-if="!hasImage"
        @click="triggerUpload"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#151515] cursor-pointer hover:bg-[#1a1a1a] transition">
        <div
          class="text-center p-10 border-2 border-dashed border-gray-600 rounded-3xl hover:border-emerald-500 hover:scale-105 transition-all duration-300 group-hover:shadow-2xl">
          <div class="text-6xl mb-4 opacity-80 group-hover:scale-110 transition transform duration-300">🖼️</div>
          <h2 class="text-3xl font-bold text-gray-200 mb-2">Upload Image</h2>
          <p class="text-gray-500">Click anywhere or Drop image here to edit</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import 'tui-image-editor/dist/tui-image-editor.css'
  // TUI 依赖一些图标和主题配置，这里我们简化引入
  // 实际上 TUI 是一个比较老的库，可能需要动态 import 以避免 SSR 报错
  const fileInput = ref<HTMLInputElement | null>(null)
  const hasImage = ref(false) // 标记是否已加载图片
  const { t } = useI18n()
  let imageEditor: any = null
  // 定义中文语言包
  const locale_zh = {
    // Zoom & Hand
    ZoomIn: '放大',
    ZoomOut: '缩小',
    Hand: '拖拽模式',
    History: '历史记录',
    Undo: '撤销',
    Redo: '重做',
    Reset: '重置',
    Delete: '删除',
    'Delete-all': '全部删除',

    // Crop
    Crop: '裁剪',
    Custom: '自定义',
    Square: '正方形',
    Apply: '应用',
    Cancel: '取消',

    // Flip & Rotate
    Flip: '翻转',
    Rotate: '旋转',
    'Flip X': '水平翻转',
    'Flip Y': '垂直翻转',
    Range: '角度',

    // Shape
    Shape: '形状',
    Rectangle: '矩形',
    Circle: '圆形',
    Triangle: '三角形',
    Fill: '填充',
    Stroke: '描边',

    // Icon
    Icon: '图标',
    Arrow: '箭头',
    'Arrow-2': '箭头2',
    'Arrow-3': '箭头3',
    'Star-1': '星星1',
    'Star-2': '星星2',
    Polygon: '多边形',
    Location: '定位',
    Heart: '心形',
    Bubble: '气泡',

    // Text
    Text: '文字',
    Bold: '加粗',
    Italic: '斜体',
    Underline: '下划线',
    Left: '左对齐',
    Center: '居中',
    Right: '右对齐',
    Color: '颜色',
    'Text size': '字体大小',

    // Mask & Image
    Mask: '遮罩',
    'Load Mask Image': '加载遮罩图',

    // Filter
    Filter: '滤镜',
    Grayscale: '灰度',
    Blur: '模糊',
    Sharpen: '锐化',
    Emboss: '浮雕',
    'Remove White': '去白底',
    Sepia: '复古',
    Sepia2: '复古2',
    Invert: '反色',
    Pixelate: '马赛克',
    Noise: '噪点',
    Brightness: '亮度',
    Tint: '色调',
    Multiply: '正片叠底',
    Blend: '混合',
    Threshold: '阈值',
    Distance: '距离',

    // Draw
    Draw: '画笔',
    Free: '自由绘制',
    Straight: '直线',

    // Load
    Load: '加载',
    Download: '下载'
  }
  // 退出编辑器
  const closeEditor = () => {
    // 可以加个确认提示防止误触
    if (hasImage.value) {
      if (!confirm('确定要退出吗？未保存的修改将会丢失。')) return
    }
    navigateTo('/')
  }
  // 触发上传
  const triggerUpload = () => {
    fileInput.value?.click()
  }

  onMounted(async () => {
    // 动态导入，确保只在客户端执行
    const ImageEditor = (await import('tui-image-editor')).default

    // 初始化编辑器
    imageEditor = new ImageEditor(document.querySelector('#tui-image-editor-container'), {
      includeUI: {
        loadImage: {
          path: 'https://placehold.co/800x600/333333/ffffff?text=Upload+Image', // 默认占位图
          name: 'SampleImage'
        },
        locale: locale_zh,
        // theme: blackTheme, // 可以自定义主题
        initMenu: 'filter',
        menuBarPosition: 'bottom',
        uiSize: {
          width: '100%',
          height: '100%'
        }
      },
      cssMaxWidth: 700,
      cssMaxHeight: 500,
      selectionStyle: {
        cornerSize: 20,
        rotatingPointOffset: 70
      }
    })

    // 修复 TUI 默认样式的一些小问题（可选）
    document.querySelector('.tui-image-editor-header-logo')?.remove() // 移除官方 Logo
  })

  const onFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file && imageEditor) {
      imageEditor.loadImageFromFile(file).then(() => {
        imageEditor.clearUndoStack()
        hasImage.value = true // ✅ 图片加载成功，隐藏遮罩
      })
    }
  }

  const saveImage = () => {
    if (!imageEditor || !hasImage.value) return
    const dataURL = imageEditor.toDataURL()
    const link = document.createElement('a')
    link.download = 'edited-image.png'
    link.href = dataURL
    link.click()
  }

  // 隐藏默认布局的 Header/Footer，全屏模式体验更好
  definePageMeta({
    layout: 'blank' // 如果你有 blank 布局的话。如果没有，保持默认也行，但可能要注意 padding
  })

  useHead({ title: t('editor.title') + ' - 小宾果' })
</script>

<style>
  /* 强制覆盖 TUI 的一些样式，让它适配暗色模式 */
  .tui-image-editor-container {
    background-color: #151515 !important;
  }
  .tui-image-editor-header {
    display: none !important; /* 隐藏它自带的丑陋头部 */
  }
  .tui-image-editor-main-container {
    background-color: #151515 !important;
    border: none !important;
  }
  /* 调整底部菜单栏颜色 */
  .tui-image-editor-menu {
    background-color: #1e1e1e !important;
  }
  .tui-image-editor-submenu {
    background-color: #1e1e1e !important;
  }
</style>
