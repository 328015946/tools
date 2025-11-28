<script setup lang="ts">
  import { ref, onBeforeUnmount, shallowRef, onMounted, triggerRef, nextTick, toRaw, markRaw } from 'vue'
  import EditorHeader from '~/components/EditorHeader.vue'
  import EditorSidebar from '~/components/EditorSidebar.vue'
  import EditorWorkspace from '~/components/EditorWorkspace.vue'
  import EditorSettings from '~/components/EditorSettings.vue'
  import ContextMenu from '~/components/ContextMenu.vue'
  import { toast } from 'vue-sonner' // [新增] 引入
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
  // --- 剪辑模式状态 ---
  const isCropping = ref(false) // 是否正在剪辑
  const croppingTarget = shallowRef<any>(null) // 正在剪辑的原始图片
  const cropZone = shallowRef<any>(null) // 那个虚线裁剪框
  // 记录进入剪辑前的状态，用于“取消”
  const cropBackup = ref({
    clipPath: null,
    angle: 0,
    left: 0,
    top: 0
  })
  // --- [新增] 图层列表状态 ---
  const layers = ref<any[]>([])
  // --- [新增] 状态用于记录哪些组被折叠了 ---
  const collapsedGroups = ref<Set<string>>(new Set())
  // index.vue
  // index.vue

  // ...
  // 1. 开始裁剪 (最终版：切换为 cropX/cropY 模式)
  const startCrop = (image: any) => {
    if (!canvas.value || isCropping.value) return

    // 获取图片的原始尺寸 (Natural Width/Height)
    // 兼容性写法：不同版本的 fabric 获取方式不同，优先取 getOriginalSize
    const originalSize = image.getOriginalSize
      ? image.getOriginalSize()
      : { width: image._element.naturalWidth, height: image._element.naturalHeight }
    const naturalWidth = originalSize.width
    const naturalHeight = originalSize.height

    // 1. 备份状态 (备份当前的裁剪参数，用于取消)
    cropBackup.value = {
      cropX: image.cropX || 0,
      cropY: image.cropY || 0,
      width: image.width,
      height: image.height,
      scaleX: image.scaleX,
      scaleY: image.scaleY,
      left: image.left,
      top: image.top,
      angle: image.angle
    }

    isCropping.value = true
    croppingTarget.value = image

    // 2. 锁定图片
    image.selectable = false
    image.evented = false
    // 旋转归零，方便计算
    image.rotate(0)
    image.setCoords()

    // 3. 计算裁剪框 (Zone) 的位置
    // Zone 应该刚好盖住图片当前“可见”的区域
    // 此时 image.width 是裁剪后的宽度 (如果之前裁过)，所以直接用 visuals
    const zoneWidth = image.width * image.scaleX
    const zoneHeight = image.height * image.scaleY
    const zoneLeft = image.left
    const zoneTop = image.top

    // 4. 【关键步骤】还原图片为“全景原图”
    // 我们要计算：当图片恢复全大小时，它应该放在哪里，才能让画面不跳动？

    const currentCropX = image.cropX || 0
    const currentCropY = image.cropY || 0

    // 计算 Zone 左上角在屏幕的绝对坐标
    const zoneTL = {
      x: zoneLeft - zoneWidth / 2,
      y: zoneTop - zoneHeight / 2
    }

    // 计算“全景原图”的左上角应该在哪里
    // 原理：全图左上角 = Zone左上角 - (左侧被裁掉的量 * 缩放)
    const fullImgTL = {
      x: zoneTL.x - currentCropX * image.scaleX,
      y: zoneTL.y - currentCropY * image.scaleY
    }

    // 恢复图片属性为全图
    image.set({
      width: naturalWidth,
      height: naturalHeight,
      cropX: 0,
      cropY: 0,
      // 重新定位中心点
      left: fullImgTL.x + (naturalWidth * image.scaleX) / 2,
      top: fullImgTL.y + (naturalHeight * image.scaleY) / 2
    })

    // 移除可能残留的 clipPath (防止旧数据干扰)
    image.set('clipPath', null)
    image.setCoords()

    // 5. 创建裁剪框
    const zone = new fabric.value.Rect({
      left: zoneLeft,
      top: zoneTop,
      width: zoneWidth,
      height: zoneHeight,
      fill: 'rgba(0,0,0,0.3)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: '#ffffff',
      cornerStrokeColor: '#3b82f6',
      transparentCorners: false,
      absolutePositioned: true,
      originX: 'center',
      originY: 'center',
      lockRotation: true,
      hasRotatingPoint: false
      // 允许任意比例缩放
    })

    canvas.value.add(zone)
    canvas.value.setActiveObject(zone)
    cropZone.value = zone
    canvas.value.requestRenderAll()
  }

  // 2. 确认裁剪 (最终版：更新 cropX/Y)
  const confirmCrop = () => {
    if (!canvas.value || !croppingTarget.value || !cropZone.value) return

    const image = croppingTarget.value
    const zone = cropZone.value

    // 此时 image 是全景原图 (Angle=0)，Zone 是裁剪区域

    // 1. 计算 Zone 左上角
    const zoneTL = {
      x: zone.left - (zone.width * zone.scaleX) / 2,
      y: zone.top - (zone.height * zone.scaleY) / 2
    }

    // 2. 计算 Image (全图) 左上角
    const imgTL = {
      x: image.left - (image.width * image.scaleX) / 2,
      y: image.top - (image.height * image.scaleY) / 2
    }

    // 3. 计算相对偏移量 (这就是 cropX/cropY)
    // 偏移量 = (Zone左边 - 图片左边) / 缩放
    const cropX = Math.max(0, (zoneTL.x - imgTL.x) / image.scaleX)
    const cropY = Math.max(0, (zoneTL.y - imgTL.y) / image.scaleY)

    // 4. 计算新的宽高 (这就是 width/height)
    const width = (zone.width * zone.scaleX) / image.scaleX
    const height = (zone.height * zone.scaleY) / image.scaleY

    // 5. 应用到图片
    image.set({
      cropX: cropX,
      cropY: cropY,
      width: width,
      height: height,
      // 【核心】图片中心点移动到 Zone 的中心点
      left: zone.left,
      top: zone.top
    })

    // 6. 恢复交互状态
    image.selectable = true
    image.evented = true
    image.rotate(cropBackup.value.angle) // 恢复之前的旋转

    // 7. 清理
    canvas.value.remove(zone)
    cropZone.value = null
    croppingTarget.value = null
    isCropping.value = false

    canvas.value.requestRenderAll()
    saveHistory()
  }
  // 3. 取消裁剪
  const cancelCrop = () => {
    if (!canvas.value || !croppingTarget.value) return

    const image = croppingTarget.value
    const backup = cropBackup.value

    // 1. 恢复所有属性
    image.set({
      cropX: backup.cropX,
      cropY: backup.cropY,
      width: backup.width,
      height: backup.height,
      scaleX: backup.scaleX,
      scaleY: backup.scaleY,
      left: backup.left,
      top: backup.top,
      angle: backup.angle,
      clipPath: null // 确保没有 clipPath 干扰
    })

    image.setCoords()

    // 2. 恢复交互
    image.selectable = true
    image.evented = true

    if (cropZone.value) {
      canvas.value.remove(cropZone.value)
    }

    cropZone.value = null
    croppingTarget.value = null
    isCropping.value = false

    canvas.value.requestRenderAll()
  }
  // --- [新增] 图片裁剪逻辑结束 ---
  // --- [修复版] 更新图层列表 (带过滤功能) ---
  const updateLayerList = () => {
    if (!canvas.value) return

    // 1. 定义映射函数
    const mapObjectToLayer = (obj: any): any => {
      // 🟢 [核心修复] 过滤替身对象
      // 如果名字以 Proxy- 开头，或者标记了 excludeFromExport，直接返回 null
      if (obj.name && typeof obj.name === 'string' && obj.name.startsWith('Proxy-')) {
        return null
      }
      if (obj.excludeFromExport) {
        return null
      }
      // 过滤辅助线
      if (obj.isGuideLine || (obj.data && obj.data.isGuide)) {
        return null
      }

      // --- 下面是正常的图层生成逻辑 ---

      // 确保有ID
      if (!obj.id) obj.id = Math.random().toString(36).substr(2, 9)

      // 命名逻辑
      let name = obj.name || '元素'
      if (!obj.name) {
        const type = obj.type
        if (['i-text', 'text', 'textbox'].includes(type)) {
          name = obj.text ? (obj.text.length > 8 ? obj.text.slice(0, 8) + '...' : obj.text) : '文字'
        } else if (type === 'image') name = '图片'
        else if (type === 'group') name = '组合'
        else if (type === 'rect') name = '矩形'
        else if (type === 'circle') name = '圆形'
        else if (type === 'path') name = '形状'
      }

      const layerNode: any = {
        id: obj.id,
        type: obj.type,
        name: name,
        visible: obj.visible,
        locked: !!obj.lockMovementX,
        collapsed: collapsedGroups.value.has(obj.id),
        objectRef: markRaw(obj),
        children: []
      }

      // 递归处理子元素
      if (obj.type === 'group' && obj.getObjects) {
        const subObjects = obj.getObjects()
        layerNode.children = [...subObjects]
          .reverse()
          .map(mapObjectToLayer)
          .filter((item: any) => item !== null) // 🟢 递归里也要过滤
      }

      return layerNode
    }

    // 2. 获取顶层对象
    const objects = canvas.value.getObjects()

    // 3. 生成列表并过滤
    layers.value = [...objects]
      .reverse()
      .map(mapObjectToLayer)
      .filter((item: any) => item !== null) // 🟢 顶层必须过滤
  }
  // --- [新增] 处理组的折叠/展开 ---
  const toggleGroupExpand = (groupId: string) => {
    if (collapsedGroups.value.has(groupId)) {
      collapsedGroups.value.delete(groupId)
    } else {
      collapsedGroups.value.add(groupId)
    }
    updateLayerList() // 刷新列表
  }
  // --- [新增] 处理图层重新排序 (Drag & Drop) ---
  const handleLayerReorder = ({ dragId, targetId, position }: any) => {
    if (!canvas.value || dragId === targetId) return

    // 1. 找到这两个对象
    // 注意：这里需要递归查找，因为对象可能在 Group 里 (暂时先实现最外层排序)
    // 如果要支持跨组拖拽会非常复杂，建议先实现顶层排序
    const objects = canvas.value.getObjects()

    const dragObj = objects.find((o: any) => o.id === dragId)
    const targetObj = objects.find((o: any) => o.id === targetId)

    if (!dragObj || !targetObj) return

    // 2. 计算新的层级索引
    // Fabric 的 stack 是 [底 ... 顶] (index 0 是背景)
    // 图层列表是 [顶 ... 底]
    // 移动逻辑：先移除 dragObj，再插入到 targetObj 的位置

    // 简单实现：使用 Fabric API
    if (position === 'top') {
      // 放到目标上面 (在 Fabric stack 里就是 moveTo 目标的 index + 1)
      // 但 Fabric 的 moveTo 是绝对 index，比较麻烦
      // 最简单的逻辑：一直 moveUp 直到 target 上面

      // 这里我们直接操作 stack 数组更可控，但 Fabric 推荐用 API
      // 这里的 position 'top' 是指在图层列表的上方 -> 对应 Canvas Z-index 更高
      dragObj.bringToFront() // 先置顶
      while (canvas.value.getObjects().indexOf(dragObj) > canvas.value.getObjects().indexOf(targetObj) + 1) {
        canvas.value.sendBackwards(dragObj)
      }
    } else {
      // 放到目标下面 -> 对应 Canvas Z-index 更低
      dragObj.sendToBack() // 先置底
      while (canvas.value.getObjects().indexOf(dragObj) < canvas.value.getObjects().indexOf(targetObj) - 1) {
        canvas.value.bringForward(dragObj)
      }
    }

    // 刷新
    canvas.value.requestRenderAll()
    updateLayerList()
    saveHistory()
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

  // index.vue

  // index.vue

  // --- [核心修复] 矩阵同步算法 ---
  const applyProxyChangesToOriginal = (group: any, original: any, proxy: any) => {
    // 1. 获取组的“绝对”变换矩阵
    const groupMatrix = group.calcTransformMatrix()

    // 2. 计算组的逆矩阵 (用于把绝对坐标转回相对坐标)
    const invertedGroupMatrix = fabric.value.util.invertTransform(groupMatrix)

    // 3. 获取替身当前的“绝对”矩阵
    const proxyMatrix = proxy.calcTransformMatrix()

    // 4. 矩阵相乘：(组逆) * (替身) = (替身在组内的相对状态)
    const relativeMatrix = fabric.value.util.multiplyTransformMatrices(invertedGroupMatrix, proxyMatrix)

    // 5. 分解矩阵得到属性 (translateX, translateY, scale, angle...)
    const opt = fabric.value.util.qrDecompose(relativeMatrix)

    // 6. [关键步骤] 应用给原始对象
    // qrDecompose 计算出的 translate 是基于中心点的
    // 所以我们必须强制原始对象也使用 Center 作为原点，否则位置会偏
    original.set({
      angle: opt.angle,
      scaleX: opt.scaleX,
      scaleY: opt.scaleY,
      skewX: opt.skewX,
      skewY: opt.skewY,
      // 坐标
      left: opt.translateX,
      top: opt.translateY,
      // 强制原点居中 (这是矩阵变换生效的前提)
      originX: 'center',
      originY: 'center',
      // 同步翻转状态
      flipX: proxy.flipX,
      flipY: proxy.flipY
    })

    // 7. 确保对象在组内坐标更新
    original.setCoords()
  }

  // index.vue

  // index.vue

  const selectLayer = (layerItem: any) => {
    const obj = toRaw(layerItem.objectRef)
    if (!canvas.value || !obj) return
    // 🟢 [新增] 如果图层被隐藏了，禁止选中，直接返回
    // 否则会生成一个可见的替身，导致“诈尸”
    if (!obj.visible) {
      return
    }

    const parentGroup = obj.group

    // 1. 视图定位 (计算绝对中心)
    const bound = obj.getBoundingRect()
    const centerX = bound.left + bound.width / 2
    const centerY = bound.top + bound.height / 2

    if (workspaceRef.value) {
      workspaceRef.value.panToCenter(centerX, centerY, canvas.value.width, canvas.value.height)
    }

    // 2. 逻辑分流
    if (parentGroup) {
      // 组内元素 -> 调用公用替身模式
      activateProxyMode(obj, parentGroup, false)
    } else {
      // 独立元素 -> 普通选中
      canvas.value.discardActiveObject()
      canvas.value.setActiveObject(obj)
      canvas.value.requestRenderAll()
      activeObject.value = obj
    }
  }
  // 2. 切换显隐
  const toggleLayerVisible = (layerItem: any) => {
    const obj = layerItem.objectRef
    if (!obj) return

    // 1. 切换自身的显隐
    obj.visible = !obj.visible

    // --- 🟢 [核心修复]：处理替身模式下的显隐 ---
    // 获取当前画布上选中的对象
    const currentActive = canvas.value.getActiveObject()

    // 情况 A: 这是一个组合内的元素
    if (obj.group) {
      obj.group.dirty = true

      // 检查：当前选中的是不是“这个元素的替身”？
      // 我们之前在 data 里存了 originalRef，现在派上用场了
      if (
        currentActive &&
        currentActive.data &&
        currentActive.data.isProxy &&
        toRaw(currentActive.data.originalRef) === toRaw(obj)
      ) {
        // 如果我正在编辑它的替身，现在我要隐藏它 -> 必须把替身也删掉！
        canvas.value.remove(currentActive)
        canvas.value.discardActiveObject()
        activeObject.value = null
      }
    }
    // 情况 B: 这是一个普通元素
    else {
      // 如果当前正好选中了它，且被隐藏了，取消选中
      if (!obj.visible && toRaw(currentActive) === toRaw(obj)) {
        canvas.value.discardActiveObject()
        activeObject.value = null
      }
    }
    // -----------------------------------------------------

    canvas.value.requestRenderAll()
    updateLayerList()
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
  const canvasSize = ref({ width: 600, height: 1000 })
  const isReady = ref(false)

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
    canvas.value.on('mouse:dblclick', handleDblClick)
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
    // 🟢 [新增] 监听鼠标按下事件：点击空白处退出剪辑
    canvas.value.on('mouse:down', (opt: any) => {
      // 只有在剪辑模式下才处理
      if (isCropping.value) {
        const target = opt.target

        // 如果点击的不是“裁剪框”本身 (target !== cropZone.value)
        // 说明点击了空白处或者画布上的其他元素
        if (target !== cropZone.value) {
          // 💡 交互建议：点击外部通常视为“确认并应用”
          // 这样用户调整完直接点别的地方就能保存，体验更顺畅
          // 如果你非常确定想要“点击外部=取消”，就把下面这行改成 cancelCrop()
          confirmCrop()
        }
      }
    })
    // 初始化时调用一次
    updateLayerList()
    // 右键菜单
    canvas.value.upperCanvasEl.addEventListener('contextmenu', handleContextMenu)

    // 智能吸附
    setupSmartGuides()

    // === 结束 ===

    saveHistory()
    window.addEventListener('keydown', handleKeydown)
    // 2. 🟢 [修复] 取消注释这一行！必须监听松开按键，否则 canvas.selection 永远是 false
    window.addEventListener('keyup', handleKeyup)
    setTimeout(() => {
      isReady.value = true
      // 再次触发一次自适应，确保显示正常
      handleResize({ width: canvasSize.value.width, height: canvasSize.value.height })
    }, 500)
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
    // 🟢 [新增] 剪辑模式专用快捷键
    if (isCropping.value) {
      // 按 Esc -> 取消 (还原)
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelCrop()
      }
      // 按 Enter -> 确认 (保存)
      if (e.key === 'Enter') {
        e.preventDefault()
        confirmCrop()
      }
      // 剪辑模式下，屏蔽 Delete 等其他按键，防止误删图片
      return
    }
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

  // --- 组合 (Group) - 适配 Fabric v6 ---
  const groupObjects = async () => {
    const rawCanvas = toRaw(canvas.value)
    if (!rawCanvas) return

    const active = rawCanvas.getActiveObject()
    // 1. 类型检查
    const type = active?.type?.toLowerCase() || ''
    if (!active || type !== 'activeselection') return

    // 2. 获取要组合的所有原始对象
    const objects = active.getObjects().map((o: any) => toRaw(o))

    // 3. 从画布上移除原来的散装对象
    active.removeAll()
    rawCanvas.remove(...objects)
    rawCanvas.discardActiveObject()

    // 4. 创建新组 【👉 修改这里】
    const group = new fabric.value.Group(objects, {
      canvas: rawCanvas,
      left: active.left,
      top: active.top,
      // 🟢 [新增] 允许检测子元素，为双击选中做准备
      subTargetCheck: true,
      // 🟢 [新增] 给个名字，方便图层显示
      name: '组合'
    })

    // 5. 添加组到画布
    rawCanvas.add(group)
    rawCanvas.setActiveObject(group)

    // 6. 更新视图
    rawCanvas.requestRenderAll()
    activeObject.value = group
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

  // index.vue

  // --- [辅助] 检测鼠标点中了组内的哪个元素 ---
  const findItemInGroup = (group: any, pointer: { x: number; y: number }) => {
    const objects = group.getObjects()
    // 倒序遍历（优先选中最上面的）
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      // 使用 containsPoint 检测
      // 注意：containsPoint 需要传入绝对坐标，所以我们不需要对 pointer 做转换
      // 但是 obj 在组里是相对坐标，containsPoint 会自动处理吗？
      // Fabric 的 containsPoint 检测的是对象的“当前变换状态”。
      // 对于组内元素，我们需要先计算它的“绝对矩阵”下的检测区域。
      // 更简单的办法：利用 fabric.Intersection 或者 v6 的 hit test 逻辑

      // V6 简易方案：利用辅助 Canvas 或数学计算
      // 这里使用 calcTransformMatrix 获取绝对位置来检测
      // 但 containsPoint 是基于对象自身的坐标系。
      // 我们使用最稳妥的方法：将 Pointer 逆变换到 Group 坐标系，再检测子元素

      // 1. 将鼠标点转为 Group 内部坐标
      /*
       复杂数学计算... 或者直接利用 Fabric 的 searchPossibleTargets (如果暴露了)。
       由于 Fabric API 比较深，这里用一个稍微 "Hack" 但精准的方法：
       临时利用辅助点检测。
    */

      // --- 实用方案 ---
      // 利用 obj.intersectsWithObject 或 containsPoint
      // 但最简单的是：obj 在渲染时是有绝对坐标矩阵的。
      // 我们利用 v6 的 api
      if (obj.containsPoint(new fabric.value.Point(pointer.x, pointer.y), true)) {
        return obj
      }
    }
    return null
  }

  // --- [修复版] 双击逻辑：复用 Proxy 模式 ---
  const handleDblClick = (opt: any) => {
    const target = toRaw(opt.target)
    if (!canvas.value || !target) return

    // === 情况 A: 独立文字 ===
    if (['i-text', 'text', 'textbox'].includes(target.type) && !target.group) {
      target.enterEditing()
      target.selectAll()
      return
    }
    // 🟢 [新增] 图片双击 -> 进入剪辑模式
    if (target.type === 'image') {
      startCrop(target)
      return
    }
    // === 情况 B: 组合 (Group) ===
    if (target.type === 'group') {
      // 1. 获取鼠标在画布上的绝对位置
      // opt.e 是原生事件，我们需要 Fabric 转换后的 pointer
      const pointer = canvas.value.getPointer(opt.e)

      // 2. 找出点中了组里哪个子元素
      // Fabric v6 的 Group 默认把事件拦截了，我们需要手动 check
      let clickedItem = null

      // 遍历子元素 (倒序，从上到下)
      const items = target.getObjects()
      for (let i = items.length - 1; i >= 0; i--) {
        const subObj = items[i]
        // 这里使用 true 参数，让 containsPoint 计算父级变换 (绝对坐标检测)
        // 这是 Fabric 很多版本都支持的特性
        if (subObj.containsPoint(new fabric.value.Point(pointer.x, pointer.y), true, true)) {
          clickedItem = subObj
          break
        }
      }

      // 3. 如果找到了子元素，激活替身模式
      if (clickedItem) {
        activateProxyMode(clickedItem, target, true)
      }
    }
  }
  // index.vue

  // index.vue

  // --- [公用] 激活替身模式 ---
  // 🟢 [新增参数] autoEdit: 是否自动进入文字编辑模式
  const activateProxyMode = (obj: any, parentGroup: any, autoEdit: boolean = false) => {
    if (obj._isProxyMode) return

    obj.clone().then((proxy: any) => {
      if (!proxy) return

      // 1. 设置替身属性
      const matrix = obj.calcTransformMatrix()
      const options = fabric.value.util.qrDecompose(matrix)

      proxy.set({
        ...options,
        left: options.translateX,
        top: options.translateY,
        angle: options.angle,
        scaleX: options.scaleX,
        scaleY: options.scaleY,
        hasControls: true,
        lockMovementX: false, // 确保允许移动
        lockMovementY: false,
        name: `Proxy-${obj.name || 'element'}`,
        excludeFromExport: true,
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#4f46e5',
        borderColor: '#4f46e5',
        borderDashArray: [4, 4],
        originX: 'center',
        originY: 'center',
        // 🟢 [核心修改点] 在这里存下真身和父级的引用
        data: {
          isProxy: true, // 标记我是个替身
          originalRef: obj, // 存下真身引用
          groupRef: parentGroup // 存下父级组引用
        }
      })

      // 2. 状态切换
      obj.visible = false
      obj._isProxyMode = true
      parentGroup.dirty = true
      canvas.value.requestRenderAll()

      // 3. 添加替身
      canvas.value.add(proxy)
      canvas.value.setActiveObject(proxy)

      // 🟢 [核心修改] 只有当 autoEdit 为 true 时，才自动进入打字模式
      if (autoEdit && ['i-text', 'text', 'textbox'].includes(proxy.type)) {
        proxy.enterEditing()
        proxy.selectAll()
      }

      // 4. 同步逻辑
      const sync = () => {
        applyProxyChangesToOriginal(parentGroup, obj, proxy)
        // 如果是文字，同步内容
        if (proxy.text !== undefined && obj.text !== undefined) {
          obj.set('text', proxy.text)
        }
        parentGroup.dirty = true
      }

      proxy.on('moving', sync)
      proxy.on('scaling', sync)
      proxy.on('rotating', sync)
      proxy.on('changed', sync) // 监听文字输入
      proxy.on('modified', saveHistory)

      // 5. 退出逻辑
      const exitProxyMode = () => {
        sync()
        canvas.value.remove(proxy)

        obj.visible = true
        delete obj._isProxyMode
        parentGroup.dirty = true
        canvas.value.requestRenderAll()

        proxy.off('deselected', exitProxyMode)
        updateLayerList()
        saveHistory()
      }

      proxy.on('deselected', exitProxyMode)

      activeObject.value = proxy
      updateLayerList()
    })
  }
  // 提取一个辅助函数：在解组后选中鼠标位置的特定元素
  const selectClickedItemInGroup = (rawCanvas: any, mouseEvent: MouseEvent) => {
    // 重新进行点击检测 (findTarget)
    const newTarget = rawCanvas.findTarget(mouseEvent)

    if (newTarget) {
      // 选中这个具体的子元素
      rawCanvas.setActiveObject(newTarget)
      activeObject.value = newTarget // 更新 Vue 状态

      // 如果是文字，进入编辑
      if (['i-text', 'text', 'textbox'].includes(newTarget.type)) {
        newTarget.enterEditing()
        newTarget.selectAll()
      }
    }
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
  // 1. 抽取一个辅助函数：根据配置创建单个 Fabric 对象
  // poster.vue

  const createFabricObject = (item: any) => {
    const common = {
      left: item.left,
      top: item.top,
      fill: item.fill,
      stroke: item.stroke || null, // 支持描边
      strokeWidth: item.strokeWidth || 0, // 支持描边粗细
      strokeDashArray: item.strokeDashArray || null, // 支持虚线
      angle: item.angle || 0, // 🟢 [新增] 支持旋转角度
      originX: 'center', // 统一中心点
      originY: 'center',
      ...(item.type === 'path' ? { width: item.width, height: item.height } : {})
    }

    if (item.type === 'rect') {
      return new fabric.value.Rect({
        ...common,
        width: item.width,
        height: item.height,
        rx: item.rx || 0,
        ry: item.ry || 0
      })
    }
    if (item.type === 'circle') {
      return new fabric.value.Circle({ ...common, radius: item.radius })
    }
    if (item.type === 'text') {
      return new fabric.value.IText(item.content, {
        ...common,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight || 'normal',
        fontFamily: 'Arial',
        textAlign: item.textAlign || 'left'
      })
    }
    if (item.type === 'path') {
      const path = new fabric.value.Path(item.path, { ...common })
      if (item.width) path.scaleToWidth(item.width)
      return path
    }

    // 🟢 [新增] 这里补上 shape 的逻辑，专门处理 component 里的五角星
    if (item.type === 'shape' && item.shape === 'star') {
      const starPath = 'M 0 -50 L 11 -15 L 47 -15 L 17 9 L 29 43 L 0 25 L -29 43 L -17 9 L -47 -15 -11 -15 Z'
      const star = new fabric.value.Path(starPath, {
        ...common,
        scaleX: 1,
        scaleY: 1
      })
      // 如果指定了宽度，缩放到指定宽度
      if (item.width) star.scaleToWidth(item.width)
      return star
    }

    return null
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
    // 🟢 [新增] 组件处理逻辑
    if (item.type === 'component') {
      const objects: any[] = []

      // 遍历子元素定义，创建 Fabric 对象
      item.children.forEach((child: any) => {
        const obj = createFabricObject(child)
        if (obj) objects.push(obj)
      })

      // 创建组合 (Group)
      // Group 会自动根据内部元素计算边界，我们将 Group 的中心放到鼠标位置
      const group = new fabric.value.Group(objects, {
        ...commonProps,
        name: item.label, // 给图层列表用
        subTargetCheck: true // 允许在组内选中子元素(需配合特定事件，或解组后编辑)
      })

      canvas.value.add(group)
      canvas.value.setActiveObject(group)
    } else if (item.type === 'text') {
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

  // 2. 替换 deleteActive 函数 (修复 is not a function 报错)
  const deleteActive = () => {
    const rawCanvas = toRaw(canvas.value)
    if (!rawCanvas) return

    const active = rawCanvas.getActiveObject()
    if (!active) return

    const rawActive = toRaw(active)
    const type = rawActive.type?.toLowerCase() || ''

    // ===============================================
    // 🟢 [场景 1] 多选删除
    // ===============================================
    if (type === 'activeselection') {
      const objects = rawActive.getObjects()
      rawCanvas.discardActiveObject()
      const rawObjects = objects.map((o: any) => toRaw(o))

      rawObjects.forEach((obj: any) => {
        const parentGroup = toRaw(obj.group)
        if (parentGroup) {
          // 兼容性移除
          if (typeof parentGroup.removeWithUpdate === 'function') {
            parentGroup.removeWithUpdate(obj)
          } else {
            parentGroup.remove(obj)
            parentGroup.set('dirty', true)
          }
        } else {
          rawCanvas.remove(obj)
        }
      })
    }
    // ===============================================
    // 🟢 [场景 2] 单选删除 (含替身模式修复)
    // ===============================================
    else {
      // 🕵️ 检查 A：当前选中的是不是一个“替身(Proxy)”？
      if (rawActive.data && rawActive.data.isProxy) {
        // 务必使用 toRaw 获取原始对象，防止 Vue Proxy 干扰
        const originalObj = toRaw(rawActive.data.originalRef)
        const parentGroup = toRaw(rawActive.data.groupRef)

        if (originalObj && parentGroup) {
          // --- 核心修复：兼容性移除逻辑 ---
          if (typeof parentGroup.removeWithUpdate === 'function') {
            // Fabric v4/v5 标准方法：移除并重新计算组大小
            parentGroup.removeWithUpdate(originalObj)
          } else {
            // Fabric v6 或 fallback：普通移除
            parentGroup.remove(originalObj)

            // v6 技巧：强制标记脏状态，触发重新布局
            parentGroup.set('dirty', true)
            parentGroup.setCoords()

            // 如果想模拟 removeWithUpdate 的效果（自动缩小框），在 v6 里比较复杂，
            // 通常 remove 后组的大小不变，只变内容。这通常是可以接受的。
          }

          // 再次标记，确保万无一失
          parentGroup.set('dirty', true)
        }

        // 3. 从画布上移除这个替身
        rawCanvas.remove(rawActive)

        // 4. 如果父级组空了，把空壳组也删掉
        // 注意：v6 的 getObjects() 返回数组，可以直接判断 length
        if (parentGroup && parentGroup.getObjects().length === 0) {
          rawCanvas.remove(parentGroup)
        }
      }
      // 🕵️ 检查 B：这是一个普通的组合内元素
      else if (rawActive.group) {
        const parentGroup = toRaw(rawActive.group)

        if (typeof parentGroup.removeWithUpdate === 'function') {
          parentGroup.removeWithUpdate(rawActive)
        } else {
          parentGroup.remove(rawActive)
          parentGroup.set('dirty', true)
        }

        if (parentGroup.getObjects().length === 0) {
          rawCanvas.remove(parentGroup)
        }
      }
      // 🕵️ 检查 C：这是画布上的独立元素
      else {
        rawCanvas.remove(rawActive)
      }

      // 收尾工作
      rawCanvas.discardActiveObject()
    }

    // ===============================================

    rawCanvas.requestRenderAll()
    activeObject.value = null
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
  // 在 saveProject 或 downloadImage 开头调用它
  const exitAllProxyModes = () => {
    // 1. 找到所有活动的替身
    const proxies = canvas.value.getObjects().filter((o: any) => o.data && o.data.isProxy)

    // 2. 遍历并执行退出逻辑
    proxies.forEach((proxy: any) => {
      const original = proxy.data.originalRef
      const parentGroup = proxy.data.groupRef

      // 同步属性回真身
      // (这里可以复用你 activateProxyMode 里的 sync 逻辑，或者简单地把 visible 设为 true)
      if (original) {
        // 简单的同步位置和角度（严谨点应该调用之前那个 sync）
        // 这里最重要的是：
        original.visible = true
      }

      // 移除替身
      canvas.value.remove(proxy)
    })

    // 3. 强制渲染
    canvas.value.requestRenderAll()
  }
  const saveProject = () => {
    exitAllProxyModes()
    const json = JSON.stringify(canvas.value.toJSON())
    const blob = new Blob([json], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'project.json'
    link.click()
  }
  const downloadImage = () => {
    exitAllProxyModes()
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
        @toggle-layer-lock="toggleLayerLock"
        @toggle-group-expand="toggleGroupExpand"
        @reorder-layer="handleLayerReorder" />

      <EditorWorkspace
        ref="workspaceRef"
        :is-loaded="isReady"
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
      <!-- 🟢 [新增] 剪辑模式操作栏 (浮动在最上层) -->
      <div
        v-if="isCropping"
        class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-white px-6 py-3 rounded-full shadow-2xl z-[9999] border border-gray-100 animate-bounce-in">
        <span class="text-sm font-bold text-gray-500 flex items-center mr-2 border-r pr-4"> ✂️ 裁剪模式 </span>
        <button
          @click="cancelCrop"
          class="px-4 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 text-sm font-medium transition text-gray-700">
          取消 (Esc)
        </button>
        <button
          @click="confirmCrop"
          class="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-md">
          确认裁剪 (Enter)
        </button>
      </div>
    </div>
  </div>
</template>
