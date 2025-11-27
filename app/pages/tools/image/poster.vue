<script setup lang="ts">
  import { ref, onBeforeUnmount, shallowRef, onMounted, triggerRef, nextTick, toRaw, markRaw } from 'vue'
  import EditorHeader from '~/components/EditorHeader.vue'
  import EditorSidebar from '~/components/EditorSidebar.vue'
  import EditorWorkspace from '~/components/EditorWorkspace.vue'
  import EditorSettings from '~/components/EditorSettings.vue'
  import ContextMenu from '~/components/ContextMenu.vue'
  import { Toaster, toast } from 'vue-sonner' // [新增] 引入
  import { EDITOR_ASSETS } from '~/constants/assets'
  // --- 数据 (Assets) ---
  const assets = EDITOR_ASSETS

  // --- 状态 ---
  const canvas = shallowRef<any>(null)
  const fabric = shallowRef<any>(null)
  const activeObject = shallowRef<any>(null)

  const zoomLevel = ref(100)
  const historyStack = ref<string[]>([])
  const historyIndex = ref(-1)
  let isHistoryProcessing = false
  // 剪贴板与右键菜单状态
  let _clipboard: any = null
  const contextMenu = ref({ visible: false, x: 0, y: 0 })

  // [新增] 平移与缩放相关的局部变量
  const isPanning = ref(false) // 是否按下空格键
  let isCanvasDragging = false // 是否正在拖拽画布
  // let lastPosX = 0
  // let lastPosY = 0

  // --- [新增] 图层列表状态 ---
  const layers = ref<any[]>([])

  // --- [新增] 更新图层列表函数 ---
  const updateLayerList = () => {
    if (!canvas.value) return

    // Fabric 的 objects 数组顺序是：[底层, ..., 顶层]
    // 图层列表通常显示为：[顶层, ..., 底层]
    // 所以我们需要 [...objects].reverse()
    const objects = canvas.value.getObjects()

    layers.value = [...objects].reverse().map((obj: any) => {
      // 🟢 [修改] 优先使用 obj.name，如果没有再根据类型判断
      let name = obj.name || '未知元素'

      if (!obj.name) {
        // 只有没名字的时候才自动推断
        if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
          name = obj.text?.slice(0, 8) + (obj.text?.length > 8 ? '...' : '') || '文字'
        } else if (obj.type === 'image') {
          name = '图片'
        } else if (obj.type === 'rect') {
          name = '矩形'
        } else if (obj.type === 'circle') {
          name = '圆形'
        } else if (obj.type === 'star') {
          name = '五角星'
        } else if (obj.type === 'triangle') {
          name = '三角形'
        } else if (obj.type === 'path') {
          name = '画笔' // 只有真正的涂鸦才叫画笔
        } else if (obj.type === 'group' || obj.type === 'activeselection') {
          name = '组合'
        }
      }

      return {
        id: obj.id || Math.random().toString(36).substr(2, 9),
        type: obj.type,
        name: name,
        visible: obj.visible,
        locked: obj.lockMovementX, // 简单判断
        objectRef: markRaw(obj)
      }
    })
  }
  // 替换原有的 alignObject 函数
  // --- 对齐逻辑 (修复多选对齐问题) ---
  const alignObject = (action: string) => {
    const rawCanvas = toRaw(canvas.value)
    if (!rawCanvas) return

    const active = rawCanvas.getActiveObject()
    if (!active) return

    const canvasWidth = rawCanvas.width
    const canvasHeight = rawCanvas.height

    // 判断是“多选”还是“单选”
    const isMultiSelection = active.type === 'activeselection'

    if (isMultiSelection) {
      // ===========================
      // 🟢 多选模式：对齐到选区边缘
      // ===========================

      // 1. 获取选区的宽高（这是整个蓝色框的大小）
      const groupWidth = active.width
      const groupHeight = active.height

      // 2. 遍历选区内的每一个子元素
      active.getObjects().forEach((obj: any) => {
        // 获取子元素当前的实际宽高（包含缩放）
        const objWidth = obj.getScaledWidth()
        const objHeight = obj.getScaledHeight()

        // 注意：在 ActiveSelection 中，(0,0) 是选区的中心点
        // 左边缘 x = -groupWidth / 2
        // 右边缘 x = groupWidth / 2
        // 上边缘 y = -groupHeight / 2
        // 下边缘 y = groupHeight / 2

        // 你的元素默认 originX/Y 都是 'center'，所以计算时要考虑 offset

        switch (action) {
          case 'left':
            // 目标：选区最左侧
            // 坐标 = 左边缘 + 对象自身的一半宽度
            obj.set('left', -groupWidth / 2 + objWidth / 2)
            break

          case 'right':
            // 目标：选区最右侧
            obj.set('left', groupWidth / 2 - objWidth / 2)
            break

          case 'centerH':
            // 目标：水平居中
            obj.set('left', 0)
            break

          case 'top':
            // 目标：选区最顶部
            obj.set('top', -groupHeight / 2 + objHeight / 2)
            break

          case 'bottom':
            // 目标：选区最底部
            obj.set('top', groupHeight / 2 - objHeight / 2)
            break

          case 'centerV':
            // 目标：垂直居中
            obj.set('top', 0)
            break
        }
      })

      // 3. 这一点非常重要：通知选区更新布局，否则视觉上可能不会立即刷新
      active.setCoords()
    } else {
      // ===========================
      // 🔵 单选模式：对齐到画布
      // ===========================

      // 获取物体当前的边界框
      const bound = active.getBoundingRect(true)

      // Fabric 的 centerObjectH/V 最好用，但贴边需要手动算
      switch (action) {
        case 'centerH':
          rawCanvas.centerObjectH(active)
          break
        case 'centerV':
          rawCanvas.centerObjectV(active)
          break
        case 'left':
          // 移动量 = 当前 left - 边界 left (即把边界 left 归零)
          active.set('left', active.left - bound.left)
          break
        case 'right':
          const distRight = canvasWidth - (bound.left + bound.width)
          active.set('left', active.left + distRight)
          break
        case 'top':
          active.set('top', active.top - bound.top)
          break
        case 'bottom':
          const distBottom = canvasHeight - (bound.top + bound.height)
          active.set('top', active.top + distBottom)
          break
      }
    }

    // 通用收尾
    active.setCoords() // 更新控制点
    rawCanvas.requestRenderAll() // 重绘
    saveHistory() // 保存历史
  }

  // --- [新增] 图片滤镜处理 ---
  // --- [修正后] 图片滤镜处理 ---
  const handleImageFilter = (filterType: string) => {
    if (!canvas.value) return
    const active = canvas.value.getActiveObject()
    // 检查是否选中了对象，且对象类型是 image
    if (!active || active.type !== 'image') return

    // 1. 获取滤镜的基础命名空间 (适配 Fabric v6)
    // v6 中滤镜通常在 fabric.filters 下，而不是 fabric.Image.filters
    const ns = fabric.value.filters || fabric.value.Image?.filters

    if (!ns) {
      console.error('无法找到滤镜模块，请检查 fabric 版本')
      return
    }

    // 2. 清除现有滤镜 (简化版：单选滤镜)
    active.filters = []

    // 3. 根据类型添加滤镜
    try {
      switch (filterType) {
        case 'grayscale':
          active.filters.push(new ns.Grayscale())
          break
        case 'sepia':
          active.filters.push(new ns.Sepia())
          break
        case 'invert':
          active.filters.push(new ns.Invert())
          break
        case 'blur':
          // 模糊滤镜需要传参
          active.filters.push(new ns.Blur({ blur: 0.5 }))
          break
        case 'contrast':
          // 对比度
          active.filters.push(new ns.Contrast({ contrast: 0.2 }))
          break
        case 'none':
        default:
          // 这里的 none 就是清空，上面 active.filters = [] 已经做了
          break
      }

      // 4. 应用滤镜 (这是必须的步骤)
      active.applyFilters()

      // 5. 重绘
      canvas.value.requestRenderAll()
      saveHistory()
    } catch (e) {
      console.error('应用滤镜失败:', e)
    }
  }
  // --- [新增] 将图片设为背景 ---
  const handleSetBackground = () => {
    if (!canvas.value) return
    const active = canvas.value.getActiveObject()

    // 1. 校验：必须选中图片
    if (!active || active.type !== 'image') {
      toast.error('请先选中一张图片')
      return
    }

    // 2. 确认提示 (可选，防止误操作)
    // 如果你已经引入了 toast/sonner，也可以不弹窗直接做，看体验偏好

    // 3. 克隆图片 (关键)
    // 我们不能直接把 active 赋给 background，因为 active 身上绑定了很多交互事件
    // 最好是 clone 一个干净的副本
    active.clone().then((clonedImg: any) => {
      const canvasWidth = canvas.value.width
      const canvasHeight = canvas.value.height
      const imgWidth = clonedImg.width
      const imgHeight = clonedImg.height

      // --- 4. 计算 Aspect Fill (等比铺满) ---
      // 比较 画布宽高比 和 图片宽高比
      const scaleX = canvasWidth / imgWidth
      const scaleY = canvasHeight / imgHeight

      // 取较大的缩放比例，保证铺满 (如果是取较小值就是 contain)
      const scale = Math.max(scaleX, scaleY)

      // 设置背景图属性
      clonedImg.set({
        originX: 'center',
        originY: 'center',
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        scaleX: scale,
        scaleY: scale,
        // 确保背景无法被选中
        selectable: false,
        evented: false,
        // 清除可能存在的圆角或裁剪
        clipPath: null,
        corners: 0
      })

      // 5. 赋值给画布背景
      canvas.value.backgroundImage = clonedImg

      // 6. 移除原来的图片元素
      canvas.value.remove(active)
      canvas.value.discardActiveObject() // 清除选中框

      // 7. 刷新与保存
      canvas.value.requestRenderAll()
      activeObject.value = null // 更新 Vue 状态
      saveHistory()

      toast.success('已设为背景')
    })
  }
  // --- [新增] 图层操作方法 ---

  // 1. 选中图层
  // poster.vue
  // 1. 定义 ref
  const workspaceRef = ref<any>(null)

  // 2. 修改 selectLayer 函数
  // poster.vue

  const selectLayer = (layerItem: any) => {
    // 1. 获取原始对象
    // layerItem.objectRef 是被 Vue 代理过的 Proxy
    // 必须用 toRaw() 转回原始 Fabric 对象，否则 canvas.contains 会返回 false
    const obj = toRaw(layerItem.objectRef)

    if (!canvas.value || !obj) return

    // 2. 检查对象是否还在画布上 (现在应该能通过了)
    if (!canvas.value.contains(obj)) {
      console.warn('对象不在画布上，正在刷新列表...')
      updateLayerList()
      return
    }

    // 3. 选中对象
    canvas.value.discardActiveObject()
    canvas.value.setActiveObject(obj)
    canvas.value.requestRenderAll()
    activeObject.value = obj

    // 4. 快速定位视图
    if (workspaceRef.value) {
      const center = obj.getCenterPoint()
      workspaceRef.value.panToCenter(center.x, center.y, canvas.value.width, canvas.value.height)
    }
  }

  // 2. 切换显隐
  const toggleLayerVisible = (layerItem: any) => {
    const obj = layerItem.objectRef
    if (!obj) return

    obj.visible = !obj.visible

    // 如果当前选中了它，且被隐藏了，取消选中
    if (!obj.visible && activeObject.value === obj) {
      canvas.value.discardActiveObject()
      activeObject.value = null
    }

    canvas.value.requestRenderAll()
    updateLayerList() // 刷新列表图标状态
    saveHistory()
  }

  // 3. 切换锁定 (锁定后无法移动和选中)
  const toggleLayerLock = (layerItem: any) => {
    const obj = layerItem.objectRef
    if (!obj) return

    const isLocked = !layerItem.locked

    // 锁定所有交互属性
    obj.lockMovementX = isLocked
    obj.lockMovementY = isLocked
    obj.lockRotation = isLocked
    obj.lockScalingX = isLocked
    obj.lockScalingY = isLocked

    // 可选：锁定时不允许选中
    // obj.selectable = !isLocked
    // obj.evented = !isLocked

    canvas.value.requestRenderAll()
    updateLayerList()
    saveHistory()
  }
  // [新增] 画布尺寸状态
  const canvasSize = ref({ width: 600, height: 800 })

  // --- 初始化 ---
  const initCanvas = async (canvasEl: HTMLCanvasElement) => {
    const fabricModule = await import('fabric')
    fabric.value = fabricModule.default || fabricModule

    canvas.value = new fabric.value.Canvas(canvasEl, {
      width: canvasSize.value.width, // [修改] 使用响应式变量
      height: canvasSize.value.height, // [修改] 使用响应式变量
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      isDrawingMode: false,
      // === 选区样式配置 ===
      selection: true, // 确保开启
      selectionColor: 'rgba(79, 70, 229, 0.1)', // 选区填充色 (淡紫)
      selectionBorderColor: '#4f46e5', // 选区边框色 (紫色)
      selectionLineWidth: 1.5 // 边框粗细
    })

    // 初始化画笔
    const brush = new fabric.value.PencilBrush(canvas.value)
    brush.width = 5
    brush.color = '#000000'
    canvas.value.freeDrawingBrush = brush

    // 基础事件
    canvas.value.on('selection:created', updateActiveObject)
    canvas.value.on('selection:updated', updateActiveObject)
    canvas.value.on('selection:cleared', () => (activeObject.value = null))
    canvas.value.on('object:modified', saveHistory)
    canvas.value.on('object:added', () => !isHistoryProcessing && saveHistory())
    canvas.value.on('path:created', () => saveHistory())
    // [新增] 在这些事件触发时更新图层列表
    const events = [
      'object:added',
      'object:removed',
      'object:modified',
      'selection:created',
      'selection:updated',
      'selection:cleared'
    ]
    events.forEach(evt => {
      canvas.value.on(evt, () => {
        // 稍微防抖一下或者直接调用
        updateLayerList()
        if (evt.includes('selection')) updateActiveObject()
      })
    })

    // 初始化时调用一次
    updateLayerList()
    // 右键菜单
    canvas.value.upperCanvasEl.addEventListener('contextmenu', handleContextMenu)

    // 智能吸附
    setupSmartGuides()

    // === [新增] 无限画布：滚轮缩放与空格平移 ===

    // 1. 滚轮缩放 (Ctrl + 滚轮)
    // canvas.value.on('mouse:wheel', (opt: any) => {
    //   const delta = opt.e.deltaY
    //   // 只有按住 Ctrl/Cmd 键才缩放，否则是浏览器默认滚动
    //   if (opt.e.ctrlKey) {
    //     let zoom = canvas.value.getZoom()
    //     zoom *= 0.999 ** delta
    //     if (zoom > 5) zoom = 5 // 限制最大 500%
    //     if (zoom < 0.1) zoom = 0.1 // 限制最小 10%

    //     // 以鼠标当前位置为中心进行缩放
    //     canvas.value.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)

    //     // 同步 UI 上的百分比
    //     zoomLevel.value = Math.round(zoom * 100)

    //     opt.e.preventDefault()
    //     opt.e.stopPropagation()
    //   }
    // })

    // // 2. 鼠标按下 (开始平移)
    // canvas.value.on('mouse:down', (opt: any) => {
    //   const evt = opt.e
    //   // 如果按下了空格键 (isPanning)，进入拖拽模式
    //   if (isPanning.value) {
    //     isCanvasDragging = true
    //     canvas.value.selection = false // 禁止框选
    //     lastPosX = evt.clientX
    //     lastPosY = evt.clientY
    //   }
    // })

    // // 3. 鼠标移动 (正在平移)
    // canvas.value.on('mouse:move', (opt: any) => {
    //   if (isCanvasDragging && canvas.value) {
    //     const e = opt.e
    //     const vpt = canvas.value.viewportTransform // 获取视口变换矩阵
    //     if (vpt) {
    //       vpt[4] += e.clientX - lastPosX // 更新 X 轴偏移
    //       vpt[5] += e.clientY - lastPosY // 更新 Y 轴偏移
    //       canvas.value.requestRenderAll() // 重绘
    //       lastPosX = e.clientX
    //       lastPosY = e.clientY
    //     }
    //   }
    // })

    // // 4. 鼠标松开 (结束平移)
    // canvas.value.on('mouse:up', () => {
    //   // 必须重新设置 viewportTransform 以应用更改
    //   if (canvas.value) {
    //     canvas.value.setViewportTransform(canvas.value.viewportTransform)
    //     isCanvasDragging = false
    //     // 如果松开了鼠标，但还没松开空格，选区依然禁止；只有松开空格才恢复选区
    //     if (!isPanning.value) {
    //       canvas.value.selection = true
    //     }
    //   }
    // })

    // === 结束 ===

    saveHistory()
    window.addEventListener('keydown', handleKeydown)
    // window.addEventListener('keyup', handleKeyup) // [新增] 监听松开空格
  }

  // --- [新增] 修改画布尺寸逻辑 ---
  const handleResize = ({ width, height }: { width: number; height: number }) => {
    if (!canvas.value) return

    // 1. 更新数据状态
    canvasSize.value = { width, height }

    // 2. 更新 Fabric 画布尺寸
    canvas.value.setDimensions({ width, height })

    // 3. [可选] 如果有背景图片，可能需要调整背景图大小
    // 简单的策略：如果用户希望背景图依然铺满，可以重新触发一次 set-bg 逻辑
    // 或者仅仅是居中背景图
    const bgImg = canvas.value.backgroundImage
    if (bgImg && bgImg instanceof fabric.value.Image) {
      // 简单居中，不做缩放，防止变形
      bgImg.set({
        left: width / 2,
        top: height / 2,
        originX: 'center',
        originY: 'center'
      })
      // 如果想要始终 cover 铺满，可以在这里加计算 scale 的逻辑
    }

    // 4. 重绘并保存历史
    canvas.value.requestRenderAll()
    saveHistory()
    // 2. [关键] 设置完尺寸后，立即自动适应屏幕
    // 使用 nextTick 确保 DOM 更新后再计算
    nextTick(() => {
      autoFit()
    })

    // 5. [体验优化] 调整缩放比例以适应新尺寸 (可选)
    // 比如：如果尺寸变得很大，自动缩小视图以便能看到全貌
    const wrapperWidth = canvas.value.wrapperEl.parentNode.clientWidth
    const wrapperHeight = canvas.value.wrapperEl.parentNode.clientHeight
    const ratio = Math.min(wrapperWidth / width, wrapperHeight / height) * 0.8
    if (ratio < 1) {
      // zoomLevel.value = Math.floor(ratio * 100)
      // canvas.value.setZoom(ratio)
      // ... 需要配合 zoomToPoint 中心缩放逻辑
    }
  }
  onBeforeUnmount(() => {
    canvas.value?.dispose()
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keyup', handleKeyup)
  })
  const workspaceSize = ref({ width: 0, height: 0 }) // [新增] 存储工作区大小
  // --- [新增] 接收 Workspace 大小变化 ---
  const handleWorkspaceResize = ({ width, height }: { width: number; height: number }) => {
    workspaceSize.value = { width, height }
    // 如果是第一次加载，也可以自动适应一下
    if (width > 0 && height > 0 && canvas.value) {
      // 可选：初始化时自动适应
      // autoFit()
    }
  }
  // --- [新增] 自动适应屏幕 (Auto Fit) ---
  const autoFit = () => {
    if (!canvas.value || workspaceSize.value.width === 0) return

    const padding = 100 // 留点边距，不要贴边
    const availableW = workspaceSize.value.width - padding
    const availableH = workspaceSize.value.height - padding

    const currentW = canvasSize.value.width
    const currentH = canvasSize.value.height

    // 计算宽和高的缩放比，取较小值，确保完全放下
    const scaleX = availableW / currentW
    const scaleY = availableH / currentH
    let scale = Math.min(scaleX, scaleY)

    // 限制一下最大 100% (如果屏幕很大，就显示 100%，不要放大到模糊)
    // 或者限制最小 10%
    if (scale > 1) scale = 1
    if (scale < 0.1) scale = 0.1

    // 更新 zoomLevel (EditorWorkspace 会根据这个值进行 CSS transform)
    zoomLevel.value = Math.floor(scale * 100)
  }
  // --- 键盘事件 ---

  // --- 键盘事件 (优化版) ---
  const handleKeydown = (e: KeyboardEvent) => {
    // 1. 输入框保护检查
    // 如果焦点在 input 或 textarea 上，不触发画布快捷键
    const activeEl = document.activeElement?.tagName
    if (activeEl === 'INPUT' || activeEl === 'TEXTAREA') return

    // 获取当前选中的对象
    const active = canvas.value?.getActiveObject()

    // --- 删除 (Del / Backspace) ---
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (active && !active.isEditing) {
        deleteActive()
      }
    }

    // --- 组合键逻辑 (Ctrl 或 Cmd) ---
    if (e.ctrlKey || e.metaKey) {
      // 2. 撤销 (Ctrl+Z)
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      // 3. 重做 (Ctrl+Y 或 Ctrl+Shift+Z)
      // Windows 习惯 Ctrl+Y，Mac 习惯 Cmd+Shift+Z
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redo()
      }

      // 4. 复制 (Ctrl+C)
      if (e.key === 'c') {
        e.preventDefault()
        copy()
      }

      // 5. 粘贴 (Ctrl+V)
      if (e.key === 'v') {
        e.preventDefault()
        paste()
      }

      // 6. 组合 (Ctrl+G)
      if (e.key === 'g' && !e.shiftKey) {
        e.preventDefault()
        groupObjects()
      }

      // 7. 解组 (Ctrl+Shift+G)
      if (e.key === 'g' && e.shiftKey) {
        e.preventDefault()
        ungroupObjects()
      }

      // 8. 保存 (Ctrl+S)
      if (e.key === 's') {
        e.preventDefault()
        saveProject() // 假设你有这个函数
      }
    }

    // --- 方向键微调 (保持之前的逻辑) ---
    if (active && !active.isEditing && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      const step = e.shiftKey ? 10 : 1
      if (e.key === 'ArrowUp') active.top -= step
      if (e.key === 'ArrowDown') active.top += step
      if (e.key === 'ArrowLeft') active.left -= step
      if (e.key === 'ArrowRight') active.left += step
      active.setCoords()
      canvas.value.requestRenderAll()
      triggerRef(activeObject)
      saveHistory()
    }

    // --- 空格平移 (保持之前的逻辑) ---
    if (e.code === 'Space' && !isPanning.value) {
      e.preventDefault()
      isPanning.value = true
      if (canvas.value) {
        canvas.value.defaultCursor = 'grab'
        canvas.value.selection = false
      }
    }
  }

  // [新增] 松开空格键 -> 关闭平移模式
  const handleKeyup = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      isPanning.value = false
      if (canvas.value) {
        canvas.value.defaultCursor = 'default' // 恢复鼠标
        canvas.value.selection = true // 恢复框选
        isCanvasDragging = false // 强制结束拖拽
      }
    }
  }

  // --- 画笔控制逻辑 ---
  const setDrawingMode = (isDrawing: boolean) => {
    if (!canvas.value) return
    canvas.value.isDrawingMode = isDrawing
    if (isDrawing) {
      canvas.value.discardActiveObject()
      canvas.value.requestRenderAll()
      if (!canvas.value.freeDrawingBrush) {
        const brush = new fabric.value.PencilBrush(canvas.value)
        brush.width = 5
        brush.color = '#000000'
        canvas.value.freeDrawingBrush = brush
      }
    }
  }
  const setBrushColor = (color: string) => {
    if (!canvas.value || !canvas.value.freeDrawingBrush) return
    canvas.value.freeDrawingBrush.color = color
  }
  const setBrushWidth = (width: number) => {
    if (!canvas.value || !canvas.value.freeDrawingBrush) return
    canvas.value.freeDrawingBrush.width = width
  }

  // --- 智能吸附逻辑 ---
  const setupSmartGuides = () => {
    let guidlelines: any[] = []
    canvas.value.on('object:moving', (e: any) => {
      const obj = e.target
      const canvasWidth = canvas.value.width
      const canvasHeight = canvas.value.height
      guidlelines = []
      const snapDist = 10
      let snapped = false
      // [新增] 辅助线吸附
      const target = e.target
      const guides = canvas.value.getObjects().filter((obj: any) => obj.data?.isGuide)

      guides.forEach((guide: any) => {
        // 简单吸附逻辑：如果距离辅助线 < 5px，就吸附上去
        // 这里需要区分横线还是竖线，逻辑稍微复杂一点点
        // 暂时先保持基础功能：手动对齐
      })
      if (Math.abs(obj.left - canvasWidth / 2) < snapDist) {
        obj.set({ left: canvasWidth / 2 })
        obj.setCoords()
        snapped = true
        guidlelines.push({ x1: canvasWidth / 2, y1: 0, x2: canvasWidth / 2, y2: canvasHeight })
      }
      if (Math.abs(obj.top - canvasHeight / 2) < snapDist) {
        obj.set({ top: canvasHeight / 2 })
        obj.setCoords()
        snapped = true
        guidlelines.push({ x1: 0, y1: canvasHeight / 2, x2: canvasWidth, y2: canvasHeight / 2 })
      }
    })
    canvas.value.on('after:render', () => {
      if (guidlelines.length === 0) return
      const ctx = canvas.value.getContext()
      ctx.save()
      ctx.strokeStyle = '#d9d9d9'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      guidlelines.forEach((line: any) => {
        ctx.beginPath()
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
        ctx.stroke()
      })
      ctx.restore()
    })
    canvas.value.on('mouse:up', () => {
      guidlelines = []
      canvas.value.requestRenderAll()
    })
  }

  // --- 右键菜单 ---
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()

    // 在显示菜单前，重新确认一下当前的 activeObject
    const active = canvas.value?.getActiveObject()
    activeObject.value = active // 确保状态最新

    contextMenu.value = { visible: true, x: e.clientX, y: e.clientY }
  }
  const handleMenuAction = (action: string) => {
    contextMenu.value.visible = false
    if (action === 'copy') copy()
    if (action === 'paste') paste()
    if (action === 'delete') deleteActive()
    if (action === 'group') groupObjects()
    if (action === 'ungroup') ungroupObjects()
    if (action === 'layer-top') changeLayer('top')
    if (action === 'layer-bottom') changeLayer('bottom')
    // [新增] 处理设为背景
    if (action === 'set-bg') handleSetBackground()
  }

  // --- 复制粘贴组合解组 ---
  const copy = async () => {
    const active = canvas.value.getActiveObject()
    if (active) {
      active.clone().then((cloned: any) => {
        _clipboard = cloned
      })
    }
  }
  const paste = async () => {
    if (!_clipboard) return
    _clipboard.clone().then((clonedObj: any) => {
      canvas.value.discardActiveObject()
      clonedObj.set({ left: clonedObj.left + 20, top: clonedObj.top + 20, evented: true })
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas.value
        clonedObj.forEachObject((obj: any) => canvas.value.add(obj))
        clonedObj.setCoords()
      } else {
        canvas.value.add(clonedObj)
      }
      _clipboard.top += 20
      _clipboard.left += 20
      canvas.value.setActiveObject(clonedObj)
      canvas.value.requestRenderAll()
      activeObject.value = clonedObj
      saveHistory()
    })
  }
  // --- 组合 (Group) - 适配 Fabric v6 ---
  // poster.vue

  // 引入 toRaw 确保操作的是原始对象
  import { toRaw } from 'vue'

  const groupObjects = async () => {
    const rawCanvas = toRaw(canvas.value)
    if (!rawCanvas) return

    const active = rawCanvas.getActiveObject()
    // 1. 类型检查
    const type = active?.type?.toLowerCase() || ''
    if (!active || type !== 'activeselection') return

    // --- 核心修复 ---

    // 2. 获取要组合的所有原始对象
    // 使用 toRaw 确保我们拿到的是 Fabric 原始实例
    const objects = active.getObjects().map((o: any) => toRaw(o))

    // 3. 【关键步骤】从画布上移除原来的散装对象
    // 如果不写这就行，图层里就会出现重复的“鬼影”
    active.removeAll() // 清空选区内部引用
    rawCanvas.remove(...objects) // 从画布彻底移除这些独立元素

    rawCanvas.discardActiveObject() // 清除选区状态

    // 4. 创建新组
    // 把刚才移除的 objects 放进组里
    const group = new fabric.value.Group(objects, {
      canvas: rawCanvas,
      // 保持原来的位置
      left: active.left,
      top: active.top
    })

    // 5. 添加组到画布
    rawCanvas.add(group)
    rawCanvas.setActiveObject(group)

    // 6. 更新视图
    rawCanvas.requestRenderAll()

    // 更新 Vue 状态
    activeObject.value = group

    // 立即刷新图层列表
    updateLayerList()
    saveHistory()

    toast.success('已组合')
  }
  // --- 解组 (Ungroup) - 适配 Fabric v6 ---
  const ungroupObjects = async () => {
    if (!canvas.value) return
    const active = canvas.value.getActiveObject()

    // 1. 类型检查
    const type = active?.type?.toLowerCase() || ''
    if (!active || type !== 'group') return

    // --- 核心修复：v6 手动解组逻辑 ---

    // 2. 获取组内所有对象
    // getObjects() 返回的是组内元素的数组
    const objects = active.getObjects()

    // 3. 关键步骤：将对象从组中彻底移除
    // 这一步会自动将对象的坐标从“相对组中心”转换为“画布绝对坐标”
    // 如果不执行这一步，对象解组后位置会乱跳
    active.removeAll()

    // 4. 从画布中移除这个组对象
    canvas.value.remove(active)

    // 5. 将原来的对象重新添加到画布上
    // 使用 spread 语法 (...) 批量添加
    canvas.value.add(...objects)

    // 6. 创建一个新的多选区 (ActiveSelection)
    // 这样解组后，用户依然可以看到选中的是这些分散的元素
    const activeSelection = new fabric.value.ActiveSelection(objects, {
      canvas: canvas.value
    })

    // 7. 选中这个新创建的多选区
    canvas.value.setActiveObject(activeSelection)

    // 8. 更新视图与 Vue 状态
    canvas.value.requestRenderAll()

    // 更新 Vue 的 activeObject，触发右侧面板刷新
    activeObject.value = activeSelection

    saveHistory()
    toast.success('已取消组合')
  }
  // --- 核心修复：更新当前选中对象 ---
  const updateActiveObject = () => {
    if (!canvas.value) return
    const active = canvas.value.getActiveObject()

    // 【关键修改 2】直接赋值引用，不要解构 {...active}
    activeObject.value = active
  }

  // --- 历史记录 ---
  const saveHistory = () => {
    if (isHistoryProcessing || !canvas.value) return
    if (historyIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
    }
    const json = JSON.stringify(canvas.value.toJSON())
    if (historyStack.value.length === 0 || historyStack.value[historyIndex.value] !== json) {
      historyStack.value.push(json)
      historyIndex.value = historyStack.value.length - 1
    }
  }
  const undo = async () => {
    if (historyIndex.value <= 0) return
    isHistoryProcessing = true
    historyIndex.value--
    await canvas.value.loadFromJSON(historyStack.value[historyIndex.value])
    canvas.value.requestRenderAll()
    isHistoryProcessing = false
  }
  const redo = async () => {
    if (historyIndex.value >= historyStack.value.length - 1) return
    isHistoryProcessing = true
    historyIndex.value++
    await canvas.value.loadFromJSON(historyStack.value[historyIndex.value])
    canvas.value.requestRenderAll()
    isHistoryProcessing = false
  }

  // 1. 这是一个纯粹的执行函数，不包含确认逻辑
  const executeApplyTemplate = (tpl: any) => {
    if (!canvas.value) return

    isHistoryProcessing = true
    canvas.value.clear()
    canvas.value.backgroundColor = tpl.data.background

    // 原有的还原逻辑
    for (const obj of tpl.data.objects) {
      let fabricObj = null
      const baseProps = {
        left: obj.left,
        top: obj.top,
        fill: obj.fill,
        opacity: obj.opacity || 1,
        originX: 'center',
        originY: 'center'
      }

      if (obj.type === 'text') {
        fabricObj = new fabric.value.IText(obj.content, {
          ...baseProps,
          fontSize: obj.fontSize,
          fontWeight: obj.fontWeight || 'normal',
          fontFamily: 'Arial',
          textAlign: obj.textAlign || 'left'
        })
      } else if (obj.type === 'rect') {
        fabricObj = new fabric.value.Rect({
          ...baseProps,
          width: obj.width,
          height: obj.height,
          rx: obj.rx || 0,
          ry: obj.ry || 0
        })
      } else if (obj.type === 'circle') {
        fabricObj = new fabric.value.Circle({ ...baseProps, radius: obj.radius })
      }

      if (fabricObj) canvas.value.add(fabricObj)
    }

    canvas.value.requestRenderAll()
    isHistoryProcessing = false
    saveHistory()

    // 可选：执行完提示一下成功
    toast.success('模版应用成功')
  }

  // 2. 这是触发函数，使用 Sonner 进行确认
  const applyTemplate = (tpl: any) => {
    // 这里的 toast 会在页面角落显示
    toast('确定应用该模版吗？', {
      description: '当前画布内容将被清空且无法直接恢复（需使用撤销）。',
      action: {
        label: '确定覆盖',
        onClick: () => executeApplyTemplate(tpl) // 点击按钮后执行上面的函数
      },
      cancel: {
        label: '取消',
        onClick: () => console.log('用户取消')
      },
      duration: 5000 // 5秒后自动消失
    })
  }

  const handleDropElement = ({ item, x, y }: { item: any; x: number; y: number }) => {
    addElement(item, x, y)
  }
  const showGrid = ref(false)

  // 1. 切换网格
  const toggleGrid = () => {
    showGrid.value = !showGrid.value
  }

  // 2. 添加辅助线 (Ruler Guides)
  const addGuide = (direction: 'h' | 'v') => {
    if (!canvas.value) return

    const canvasWidth = canvas.value.width
    const canvasHeight = canvas.value.height
    const center = canvas.value.getVpCenter()

    let points: [number, number, number, number] = [0, 0, 0, 0]
    let props = {}

    if (direction === 'h') {
      // 水平线：横穿画布
      points = [0, center.y, canvasWidth, center.y]
      props = {
        lockMovementX: true, // 只能上下拖动
        lockMovementY: false,
        cursor: 'ns-resize' // 鼠标样式
      }
    } else {
      // 垂直线：纵穿画布
      points = [center.x, 0, center.x, canvasHeight]
      props = {
        lockMovementX: false, // 只能左右拖动
        lockMovementY: true,
        cursor: 'ew-resize'
      }
    }

    const line = new fabric.value.Line(points, {
      ...props,
      stroke: '#06b6d4', // 青色辅助线
      strokeWidth: 1,
      strokeDashArray: [5, 5], // 虚线
      selectable: true,
      evented: true,
      // === 核心属性 ===
      excludeFromExport: true, // 导出图片时忽略它！
      hoverCursor: props.cursor,
      id: 'guide-line', // 用于识别
      data: { isGuide: true } // 自定义标记
    })

    canvas.value.add(line)
    canvas.value.setActiveObject(line)
    canvas.value.requestRenderAll()

    // 辅助线不计入历史记录比较好，或者你觉得需要撤销也可以计入
    // saveHistory()
  }
  // poster.vue

  const addElement = (item: any, dropX?: number, dropY?: number) => {
    if (!canvas.value) return
    let left, top

    // === [修改开始] 坐标计算逻辑适配 CSS 缩放 ===
    if (dropX !== undefined && dropY !== undefined) {
      // 1. 获取 Canvas 元素在屏幕上的实时位置（包含 CSS 平移和缩放后的结果）
      const rect = canvas.value.upperCanvasEl.getBoundingClientRect()

      // 2. 计算缩放比例 (假设 zoomLevel 是 0-100 的整数，如 50 代表 0.5)
      // 如果你的 zoomLevel 是 ref，记得加 .value
      const scale = zoomLevel.value / 100

      // 3. 计算 Canvas 内部坐标
      // 公式：(鼠标屏幕坐标 - Canvas屏幕左上角) / 缩放倍率
      left = (dropX - rect.left) / scale
      top = (dropY - rect.top) / scale
    } else {
      // 点击添加时，默认放到画布中心
      left = canvas.value.width / 2
      top = canvas.value.height / 2
    }
    // === [修改结束] ===

    const commonProps = { left, top, originX: 'center', originY: 'center' }

    if (item.type === 'text') {
      const text = new fabric.value.IText(item.content, {
        ...commonProps,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight,
        fontFamily: 'Arial',
        fill: '#333333',
        // [新增] 预设高级属性
        charSpacing: 0,
        lineHeight: 1.16,
        shadow: null,
        stroke: null,
        strokeWidth: 0
      })
      canvas.value.add(text)
      canvas.value.setActiveObject(text)
    } else if (item.type === 'shape') {
      let shape
      const opts = { ...commonProps, fill: item.color, width: 100, height: 100 }
      if (item.shape === 'rect') shape = new fabric.value.Rect(opts)
      if (item.shape === 'circle') shape = new fabric.value.Circle({ ...opts, radius: 50 })
      if (item.shape === 'triangle') shape = new fabric.value.Triangle(opts)
      // [新增] 五角星支持
      if (item.shape === 'star') {
        // 这是一个标准的五角星 Path
        const starPath = 'M 0 -50 L 11 -15 L 47 -15 L 17 9 L 29 43 L 0 25 L -29 43 L -17 9 L -47 -15 L -11 -15 Z'
        shape = new fabric.value.Path(starPath, {
          ...opts,
          scaleX: 1, // Path 需要单独调整缩放
          scaleY: 1
        })
        // Path 的宽高计算比较特殊，这里手动缩放一下使其接近 100px
        shape.scaleToWidth(100)
      }
      if (shape) {
        canvas.value.add(shape)
        canvas.value.setActiveObject(shape)
      }
    } else if (item.type === 'image') {
      fabric.value.FabricImage.fromURL(item.url, { crossOrigin: 'anonymous' })
        .then((img: any) => {
          if (!img) return
          img.set({ ...commonProps })
          // 限制一下图片初始大小，避免太大了
          if (img.width > 300) img.scaleToWidth(300)
          canvas.value.add(img)
          canvas.value.setActiveObject(img)
          saveHistory()
        })
        .catch((err: any) => console.error(err))
    }
  }

  // --- 属性/背景/下载 ---
  const handleUploadImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = f => {
      const data = f.target?.result as string
      fabric.value.FabricImage.fromURL(data).then((img: any) => {
        if (!img) return
        const vpCenter = canvas.value.getVpCenter()
        img.set({ left: vpCenter.x, top: vpCenter.y, originX: 'center', originY: 'center' })
        if (img.width > canvas.value.width / 2) img.scaleToWidth(canvas.value.width / 2)
        canvas.value.add(img)
        canvas.value.setActiveObject(img)
        saveHistory()
      })
    }
    reader.readAsDataURL(file)
  }
  // 修复圆角更新
  const handleImageRadius = (radius: number) => {
    const active = canvas.value.getActiveObject()
    if (!active || active.type !== 'image') return // 我们把自定义属性存到对象上
    ;(active as any).corners = radius

    if (radius === 0) active.set('clipPath', null)
    else {
      const clipRect = new fabric.value.Rect({
        width: active.width,
        height: active.height,
        rx: radius,
        ry: radius,
        originX: 'center',
        originY: 'center'
      })
      active.set('clipPath', clipRect)
    }

    canvas.value.requestRenderAll()
    // 通知 Vue 更新
    triggerRef(activeObject)
    saveHistory()
  }
  // --- 修改 poster.vue 中的设置背景色逻辑 ---

  const setBackgroundColor = (color: string) => {
    if (!canvas.value) return

    // 1. 设置背景色
    canvas.value.backgroundColor = color

    // 2. 【关键修复】清除背景图片
    // 如果不加这一行，之前设置的背景图会一直挡在颜色上面
    canvas.value.backgroundImage = null

    // 3. 刷新视图
    canvas.value.requestRenderAll()
    saveHistory()
  }
  // --- 核心修复：属性更新 (Update Prop) ---
  const updateProp = ({ key, value }: { key: string; value: any }) => {
    const active = canvas.value?.getActiveObject()
    if (active) {
      active.set(key, value)

      if (key === 'fontSize' || key === 'scaleX' || key === 'scaleY') {
        active.setCoords() // 重新计算控制点
      }

      canvas.value.requestRenderAll()

      // 【关键修改 5】不要重新赋值，而是通知 Vue 引用内部发生了变化
      // 不要写 activeObject.value = { ...active }，这会丢失方法！
      triggerRef(activeObject)

      saveHistory()
    }
  }
  // 修复样式切换
  const toggleStyle = (style: 'bold' | 'italic') => {
    const active = canvas.value?.getActiveObject()
    if (!active || !['i-text', 'text', 'textbox'].includes(active.type)) return

    if (style === 'bold') {
      active.set('fontWeight', active.fontWeight === 'bold' ? 'normal' : 'bold')
    }
    if (style === 'italic') {
      active.set('fontStyle', active.fontStyle === 'italic' ? 'normal' : 'italic')
    }

    canvas.value.requestRenderAll()
    triggerRef(activeObject) // 通知更新
    saveHistory()
  }
  const changeLayer = (action: string) => {
    const active = canvas.value?.getActiveObject()
    if (!active) return
    if (action === 'up') canvas.value.bringObjectForward(active)
    if (action === 'down') canvas.value.sendObjectBackwards(active)
    if (action === 'top') canvas.value.bringObjectToFront(active)
    if (action === 'bottom') canvas.value.sendObjectToBack(active)
    canvas.value.requestRenderAll()
    saveHistory()
  }
  // poster.vue

  // 2. 替换 deleteActive 函数
  const deleteActive = () => {
    // 获取 canvas 原始实例
    const rawCanvas = toRaw(canvas.value)
    if (!rawCanvas) return

    // 获取当前选中的对象 (可能是 Proxy)
    const active = rawCanvas.getActiveObject()
    if (!active) return

    // 【核心修复】获取原始对象 (去除 Vue Proxy 包装)
    // Fabric 内部比对引用时，Proxy != Raw，导致找不到对象无法删除
    const rawActive = toRaw(active)

    const type = rawActive.type?.toLowerCase() || ''
    console.log('正在删除对象(Raw模式)，类型:', type)

    // 1. 先取消选中状态 (这步很重要，防止删除后 Canvas 还认为它被选中)
    rawCanvas.discardActiveObject()

    // 2. 分情况删除
    if (type === 'activeselection') {
      // === 多选框 ===
      const objects = rawActive.getObjects()
      // 确保里面的每个子对象也是 raw 的
      const rawObjects = objects.map((o: any) => toRaw(o))
      rawCanvas.remove(...rawObjects)
    } else {
      // === Group (组合) 或 普通元素 ===
      // 直接移除原始对象
      rawCanvas.remove(rawActive)
    }

    // 3. 强制重绘
    rawCanvas.requestRenderAll()

    // 4. 清理 Vue 状态
    activeObject.value = null

    // 5. 立即更新图层列表
    updateLayerList()

    saveHistory()
  }
  // --- 修改 handleZoom (滚轮缩放) ---
  const handleZoom = (delta: number) => {
    let newZoom = zoomLevel.value + delta
    if (newZoom < 10) newZoom = 10
    if (newZoom > 500) newZoom = 500
    zoomLevel.value = newZoom
    // 注意：这里不需要调用 canvas.setZoom 了，因为我们现在用的是 CSS transform
  }
  const saveProject = () => {
    const json = JSON.stringify(canvas.value.toJSON())
    const blob = new Blob([json], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'project.json'
    link.click()
  }
  const downloadImage = () => {
    const dataURL = canvas.value.toDataURL({ format: 'png', quality: 1, multiplier: 2 })
    const link = document.createElement('a')
    link.download = `design-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-gray-50 text-gray-800 font-sans overflow-hidden">
    <EditorHeader
      :history-index="historyIndex"
      :history-length="historyStack.length"
      :canvas-width="canvasSize.width"
      :canvas-height="canvasSize.height"
      @undo="undo"
      @redo="redo"
      @resize="handleResize"
      @save="saveProject"
      @download="downloadImage"
      @toggle-grid="toggleGrid"
      @add-guide="addGuide" />

    <div class="flex-1 flex overflow-hidden">
      <EditorSidebar
        :assets="assets"
        :layers="layers"
        @add-element="addElement"
        @apply-template="applyTemplate"
        @set-bg-color="setBackgroundColor"
        @upload-image="handleUploadImage"
        @set-drawing-mode="setDrawingMode"
        @set-brush-color="setBrushColor"
        @set-brush-width="setBrushWidth"
        @select-layer="selectLayer"
        @toggle-layer-visible="toggleLayerVisible"
        @toggle-layer-lock="toggleLayerLock" />

      <EditorWorkspace
        ref="workspaceRef"
        :zoom-level="zoomLevel"
        :show-grid="showGrid"
        @canvas-ready="initCanvas"
        @update-zoom="handleZoom"
        @drop-element="handleDropElement"
        @workspace-resize="handleWorkspaceResize" />

      <EditorSettings
        :active-object="activeObject"
        @update-prop="updateProp"
        @change-layer="changeLayer"
        @delete="deleteActive"
        @toggle-style="toggleStyle"
        @update-image-radius="handleImageRadius"
        @group="groupObjects"
        @ungroup="ungroupObjects"
        @align="alignObject"
        @update-filter="handleImageFilter"
        @set-as-bg="handleSetBackground" />

      <ContextMenu
        :visible="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :selection-type="activeObject?.type"
        :has-selection="!!activeObject"
        :is-group="activeObject?.type === 'group'"
        @close="contextMenu.visible = false"
        @action="handleMenuAction" />
    </div>
  </div>
</template>
