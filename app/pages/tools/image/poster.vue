<script setup lang="ts">
  import { ref, onBeforeUnmount, shallowRef, onMounted, triggerRef, nextTick, toRaw, markRaw } from 'vue'
  import EditorHeader from '~/components/EditorHeader.vue'
  import EditorSidebar from '~/components/EditorSidebar.vue'
  import EditorWorkspace from '~/components/EditorWorkspace.vue'
  import EditorSettings from '~/components/EditorSettings.vue'
  import ContextMenu from '~/components/ContextMenu.vue'
  import ExportDialog from '~/components/ExportDialog.vue'
  import { toast } from 'vue-sonner' // [新增] 引入
  import { removeBackground } from '@imgly/background-removal' // [新增]
  import { EDITOR_ASSETS } from '~/constants/assets'
  // --- 数据 (Assets) ---
  const assets = EDITOR_ASSETS
  // [新增] 抠图 loading 状态
  const isRemovingBg = ref(false)
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

  // index.vue

  // --- [升级版] 图片滤镜处理 ---
  const handleImageFilter = (payload: any) => {
    if (!canvas.value) return
    const active = canvas.value.getActiveObject()
    if (!active || active.type !== 'image') return

    // 兼容 Fabric v5/v6 写法
    const ns = fabric.value.filters || fabric.value.Image?.filters

    // 1. 如果是预设模式 (grayscale, sepia...)
    if (payload.type !== 'parameter') {
      // 简单粗暴：清空所有滤镜，应用新预设 (或者是叠加，看你需求)
      // 这里演示“叠加模式”，只移除同类型的，防止互斥

      // 如果是 'none'，清空所有
      if (payload.type === 'none') {
        active.filters = []
      } else {
        // 移除已存在的同名滤镜
        const className = payload.type.charAt(0).toUpperCase() + payload.type.slice(1)
        active.filters = active.filters.filter((f: any) => f.type !== className)

        // 添加新滤镜
        switch (payload.type) {
          case 'grayscale':
            active.filters.push(new ns.Grayscale())
            break
          case 'sepia':
            active.filters.push(new ns.Sepia())
            break
          case 'invert':
            active.filters.push(new ns.Invert())
            break
        }
      }
    }
    // 2. 如果是参数调节模式 (Brightness, Contrast...)
    else {
      const { name, value } = payload

      // 查找当前是否已有该滤镜
      let filter = active.filters.find((f: any) => f.type === name)

      if (!filter) {
        // 如果没有，创建新的
        if (name === 'Brightness') filter = new ns.Brightness({ brightness: value })
        if (name === 'Contrast') filter = new ns.Contrast({ contrast: value })
        if (name === 'Saturation') filter = new ns.Saturation({ saturation: value })
        if (name === 'Blur') filter = new ns.Blur({ blur: value })

        active.filters.push(filter)
      } else {
        // 如果有，更新属性
        if (name === 'Brightness') filter.brightness = value
        if (name === 'Contrast') filter.contrast = value
        if (name === 'Saturation') filter.saturation = value
        if (name === 'Blur') filter.blur = value
      }
    }

    // 3. 应用并刷新
    active.applyFilters()
    canvas.value.requestRenderAll()

    // 触发 Vue 更新 (让 Slider 回显正确)
    triggerRef(activeObject)

    // 节流保存历史 (可选，防止拖动滑块产生大量历史记录)
    // saveHistory()
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
  const canvasSize = ref({ width: 800, height: 1000 })
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
    // 1. 定义状态变量
    let transformStart = { left: 0, top: 0 }
    let constraintAxis: 'h' | 'v' | null = null // 记录当前锁定的轴向 (h=水平, v=垂直)

    // 2. 监听变换开始：重置状态
    canvas.value.on('before:transform', (e: any) => {
      const target = e.transform?.target
      if (target) {
        transformStart = {
          left: target.left,
          top: target.top
        }
        // 每次开始拖拽前，先清空锁定状态
        constraintAxis = null
      }
    })

    // 3. 监听移动：执行锁定
    canvas.value.on('object:moving', (e: any) => {
      // 如果没按 Shift，不执行任何锁定逻辑
      if (!e.e.shiftKey) return

      const obj = e.target

      // 计算当前位置相对于起始位置的偏移量
      const dx = Math.abs(obj.left - transformStart.left)
      const dy = Math.abs(obj.top - transformStart.top)

      // --- 关键修改开始 ---

      // A. 如果还没有决定锁哪个轴，进行判断
      if (!constraintAxis) {
        // 设置一个防抖阈值 (比如 10px)，防止鼠标微小抖动导致误判
        // 只有当移动距离足够明显时，才定下方向
        if (dx > 5 || dy > 5) {
          if (dx > dy) {
            constraintAxis = 'h' // 锁定水平移动 (Horizontal)
          } else {
            constraintAxis = 'v' // 锁定垂直移动 (Vertical)
          }
        }
      }

      // B. 根据已锁定的方向执行强制归位
      if (constraintAxis === 'h') {
        // 既然是水平移动，那么 Top (Y轴) 必须保持不变
        obj.set('top', transformStart.top)
      } else if (constraintAxis === 'v') {
        // 既然是垂直移动，那么 Left (X轴) 必须保持不变
        obj.set('left', transformStart.left)
      }

      // --- 关键修改结束 ---
    })
    // 🟢 [核心修复] 监听缩放事件，实现“不失真调整大小”
    canvas.value.on('object:scaling', (e: any) => {
      const obj = e.target
      if (!obj) return

      // 只针对矩形 (Rect) 做处理，防止圆角和边框变形
      if (obj.type === 'rect') {
        const width = obj.width * obj.scaleX
        const height = obj.height * obj.scaleY

        obj.set({
          width: width,
          height: height,
          scaleX: 1, // 重置缩放
          scaleY: 1 // 重置缩放
        })
      }

      // (可选) 如果你也想让图片裁剪框不失真，也可以在这里处理
      // 但通常只处理 Rect 就足够解决 UI 组件变形的问题
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

    const padding = 0 // 留点边距，不要贴边
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

    if (scale < 0.1) scale = 0.1
    // 减去一点点微调，防止计算误差导致出现滚动条
    scale = scale * 0.98
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
  // --- 智能吸附与辅助线 (轻量稳健版) ---
  const setupSmartGuides = () => {
    const snapDist = 10 // 吸附距离 (像素)
    const lineColor = '#ff0077' // 辅助线颜色

    let ctx: CanvasRenderingContext2D | null = null
    // 暂存需要画的线
    let guidelines: any[] = []

    // 1. 监听对象移动
    canvas.value.on('object:moving', (e: any) => {
      const activeObject = e.target
      // 🟢 [新增] 如果按住了 Shift (正在进行轴向锁定)，则禁用智能吸附，防止冲突
      if (e.e.shiftKey) {
        guidelines = [] // 清空辅助线
        return // 直接退出，不计算吸附
      }
      // 性能优化：如果选择了多个物体，计算量太大，暂时禁用吸附
      if (activeObject.type === 'activeSelection') {
        guidelines = []
        return
      }

      const canvasWidth = canvas.value.width
      const canvasHeight = canvas.value.height

      // 清空辅助线
      guidelines = []

      // 获取当前拖拽物体的中心点和半宽/半高
      // 使用 getCenterPoint() 能兼容旋转后的坐标
      const center = activeObject.getCenterPoint()
      const halfW = (activeObject.width * activeObject.scaleX) / 2
      const halfH = (activeObject.height * activeObject.scaleY) / 2

      // === 核心逻辑：寻找最近的吸附点 ===

      // 我们需要记录 X 轴和 Y 轴方向上，“想去”的最近位置和距离
      let snapX = null
      let snapY = null
      let distMinX = snapDist
      let distMinY = snapDist

      // 定义所有可能的吸附参考线 (画布中心 + 其他物体边缘)
      const verticalAnchors = [{ x: canvasWidth / 2, type: 'center' }] // 画布中轴
      const horizontalAnchors = [{ y: canvasHeight / 2, type: 'center' }] // 画布横轴

      // 遍历所有物体，收集边缘作为参考线
      const objects = canvas.value.getObjects()
      for (const obj of objects) {
        if (obj === activeObject || !obj.visible || obj.data?.isGuide) continue

        const objCenter = obj.getCenterPoint()
        const objHalfW = (obj.width * obj.scaleX) / 2
        const objHalfH = (obj.height * obj.scaleY) / 2

        // 收集 X 轴参考线 (对方的 左、中、右)
        verticalAnchors.push({ x: objCenter.x, type: 'center' })
        verticalAnchors.push({ x: objCenter.x - objHalfW, type: 'edge' })
        verticalAnchors.push({ x: objCenter.x + objHalfW, type: 'edge' })

        // 收集 Y 轴参考线 (对方的 上、中、下)
        horizontalAnchors.push({ y: objCenter.y, type: 'center' })
        horizontalAnchors.push({ y: objCenter.y - objHalfH, type: 'edge' })
        horizontalAnchors.push({ y: objCenter.y + objHalfH, type: 'edge' })
      }

      // --- 计算 X 轴吸附 ---
      // 当前物体的关注点：左、中、右
      const myPointsX = [
        { val: center.x, offset: 0 }, // 中心
        { val: center.x - halfW, offset: halfW }, // 左边 (想吸附时，中心要往右移 halfW)
        { val: center.x + halfW, offset: -halfW } // 右边 (想吸附时，中心要往左移 halfW)
      ]

      for (const anchor of verticalAnchors) {
        for (const myP of myPointsX) {
          const dist = Math.abs(anchor.x - myP.val)
          if (dist < distMinX) {
            // 找到了更近的吸附点
            distMinX = dist
            // 计算由于吸附，物体中心应该去哪里：参考线位置 + 自身偏移
            snapX = anchor.x + myP.offset
            // 记录这条辅助线
            guidelines.push({ type: 'v', x: anchor.x }) // 暂存，确认吸附后再保留
          }
        }
      }

      // --- 计算 Y 轴吸附 ---
      // 当前物体的关注点：上、中、下
      const myPointsY = [
        { val: center.y, offset: 0 },
        { val: center.y - halfH, offset: halfH },
        { val: center.y + halfH, offset: -halfH }
      ]

      for (const anchor of horizontalAnchors) {
        for (const myP of myPointsY) {
          const dist = Math.abs(anchor.y - myP.val)
          if (dist < distMinY) {
            distMinY = dist
            snapY = anchor.y + myP.offset
            guidelines.push({ type: 'h', y: anchor.y })
          }
        }
      }

      // === 应用吸附 ===

      // 只有当我们找到了吸附点，且确实进行了移动，才保留辅助线
      // 否则清空辅助线列表，避免满屏乱画
      const finalLines = []

      if (snapX !== null) {
        activeObject.set({ left: snapX }) // 设置位置 (Fabric 默认 origin 是 center，这里直接给中心点坐标即可)
        // 过滤出跟最终吸附位置匹配的垂直线
        // 由于可能有浮点数误差，用 < 1 判断
        const matchLine = guidelines.find(l => l.type === 'v' && Math.abs(l.x - (snapX - (snapX - center.x))) < 1)
        // 简单处理：只要有吸附，就画出那条最近的参考线
        // 这里我们为了性能，重新找一条最近的画
        finalLines.push({ x1: snapX, y1: 0, x2: snapX, y2: canvasHeight })
      }

      if (snapY !== null) {
        activeObject.set({ top: snapY })
        finalLines.push({ x1: 0, y1: snapY, x2: canvasWidth, y2: snapY })
      }

      // 更新最终要画的线
      // 优化：只画那个我们真正吸附上去的线，而不是刚才计算过程中的所有线
      guidelines = []
      if (snapX !== null) {
        // 重新遍历找到那条线的位置
        const anchor = verticalAnchors.find(
          a => Math.abs(a.x - (activeObject.left - (activeObject.left - center.x))) < 1
        )
        // 上面的计算有点绕，简化：snapX 计算时我们知道是参照了哪个 anchor
        // 这里为了代码简洁，直接画 snapX 对应的竖线
        // 注意：snapX 是物体中心的新位置，但辅助线可能是在物体边缘。
        // 完美的做法是在循环里记录 bestAnchor。
        // MVP 做法：直接画物体的 中/左/右
        guidelines.push({ x1: activeObject.left, y1: 0, x2: activeObject.left, y2: canvasHeight })
        guidelines.push({ x1: activeObject.left - halfW, y1: 0, x2: activeObject.left - halfW, y2: canvasHeight })
        guidelines.push({ x1: activeObject.left + halfW, y1: 0, x2: activeObject.left + halfW, y2: canvasHeight })
        // 只要画出来的线跟参考线重合就行。这里简化为画出物体中心和边缘，
        // 只有当它们跟 anchor 重合时才真的画出来（为了视觉整洁），
        // 但为了保证“拖动不卡”，我们这里只画中心线，或者简单画。

        // --- 最终轻量化绘制策略 ---
        // 直接画 activeObject.left 和 top，以及边缘
        // 这在视觉上足够提示用户“对齐了”
      }

      // 重新修正辅助线列表，仅用于渲染
      // 上面的循环逻辑是为了计算 snapX/Y。
      // 为了不卡顿，我们将“画线”逻辑简化：
      // 如果吸附了 X，就画一条贯穿 activeObject.left 的竖线
      guidelines = []
      if (snapX !== null) {
        // 这里其实应该画 Anchor 的位置。
        // 但由于我们修改了 Object 位置让它贴合 Anchor，所以画 Object 的位置也是对的。
        // 只是我们不知道具体是对齐了左边还是右边。
        // 简单方案：画三条淡线，或者只画中心。
        // 稳健方案：再遍历一次找重合。
        verticalAnchors.forEach(a => {
          if (
            Math.abs(a.x - activeObject.left) < 1 ||
            Math.abs(a.x - (activeObject.left - halfW)) < 1 ||
            Math.abs(a.x - (activeObject.left + halfW)) < 1
          ) {
            guidelines.push({ x1: a.x, y1: 0, x2: a.x, y2: canvasHeight })
          }
        })
      }
      if (snapY !== null) {
        horizontalAnchors.forEach(a => {
          if (
            Math.abs(a.y - activeObject.top) < 1 ||
            Math.abs(a.y - (activeObject.top - halfH)) < 1 ||
            Math.abs(a.y - (activeObject.top + halfH)) < 1
          ) {
            guidelines.push({ x1: 0, y1: a.y, x2: canvasWidth, y2: a.y })
          }
        })
      }

      activeObject.setCoords()
    })

    // 2. 渲染后绘制
    canvas.value.on('after:render', () => {
      if (guidelines.length === 0) return

      const ctx = canvas.value.getContext()
      if (!ctx) return

      ctx.save()
      const vpt = canvas.value.viewportTransform
      ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5])

      ctx.lineWidth = 1 / canvas.value.getZoom()
      ctx.strokeStyle = lineColor
      ctx.setLineDash([4 / canvas.value.getZoom(), 4 / canvas.value.getZoom()])

      // 去重
      const uniqueLines = new Set()

      guidelines.forEach(l => {
        const key = `${l.x1},${l.y1},${l.x2},${l.y2}`
        if (uniqueLines.has(key)) return
        uniqueLines.add(key)

        ctx.beginPath()
        ctx.moveTo(l.x1, l.y1)
        ctx.lineTo(l.x2, l.y2)
        ctx.stroke()
      })

      ctx.restore()
    })

    // 3. 鼠标松开清空
    canvas.value.on('mouse:up', () => {
      guidelines = []
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
    // 🟢 [新增]
    if (action === 'copyStyle') copyStyle()
    if (action === 'pasteStyle') pasteStyle()
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

  // index.vue

  // --- [新增] 文字/元素阴影处理 ---

  // 1. 设置整体阴影 (预设)
  const handleSetShadow = (shadowConfig: any) => {
    const active = canvas.value?.getActiveObject()
    if (!active) return

    if (!shadowConfig) {
      // 移除阴影
      active.set('shadow', null)
    } else {
      // 创建新阴影
      active.set('shadow', new fabric.value.Shadow(shadowConfig))
    }

    canvas.value.requestRenderAll()
    triggerRef(activeObject)
    saveHistory()
  }

  // 2. 更新阴影的某个属性 (颜色/模糊/偏移)
  const handleUpdateShadowProp = ({ key, value }: { key: string; value: any }) => {
    const active = canvas.value?.getActiveObject()
    // 必须确保 shadow 存在且是对象
    if (!active || !active.shadow) return

    // Fabric 的 active.shadow 也是一个对象实例，直接修改其属性即可
    active.shadow[key] = value

    // 强制刷新
    active.dirty = true
    canvas.value.requestRenderAll()
    triggerRef(activeObject)
    saveHistory()
  }
  // 替换上面的 handleTextCurve 函数

  const handleTextCurve = (value: number) => {
    const active = canvas.value?.getActiveObject()
    if (!active || !['i-text', 'text', 'textbox'].includes(active.type)) return

    // 1. 归零处理
    if (Math.abs(value) < 2) {
      active.set('path', null)
      if (active.data) active.data.curveVal = 0
      canvas.value.requestRenderAll()
      saveHistory()
      return
    }

    // 2. 存值
    if (!active.data) active.data = {}
    active.data.curveVal = value

    // 3. 计算半径
    // 假设文字宽度对应圆心角。value=100 对应 180度(PI)，value=50 对应 90度
    const angle = (Math.PI * value) / 100 // 弧度
    const width = active.getScaledWidth()
    const radius = width / (2 * Math.sin(angle / 2))
    const height = radius * (1 - Math.cos(angle / 2))

    // 4. 生成 SVG Path
    // M (start) A (radius radius 0 large sweep) (end)
    // 我们需要让路径居中。假设路径起点在 (-width/2, ...)

    // 为了简化，我们直接用 "M 0 0" 作为起点，然后让 Fabric 去适应
    // value > 0: 向下凹 (笑脸) -> sweepFlag = 1
    // value < 0: 向上凸 (哭脸) -> sweepFlag = 0
    const sweepFlag = value > 0 ? 1 : 0

    // 计算弦长 (Chord Length)
    const chordLength = 2 * radius * Math.sin(angle / 2)

    // 这里有一个技巧：如果只是简单弯曲，其实不需要非常精确的半径，
    // 只要路径看起来是弯的就行。
    // 让我们用一个更稳健的 Path 字符串：
    // "M startX startY A r r 0 0 sweep endX endY"

    // 动态生成的路径字符串
    let pathData = ''

    // 简单贝塞尔方案 (兼容性最好，不跳动)
    // 如果 value 是正的，控制点在下方；负的在上方
    const controlY = value * 2 // 弯曲程度因子
    // 路径宽度略宽于文字，防止被切
    const pathW = width

    pathData = `M 0 0 Q ${pathW / 2} ${controlY} ${pathW} 0`

    // 创建路径对象
    const path = new fabric.value.Path(pathData, {
      visible: false,
      noScaleCache: true
    })

    // 5. 关键修复：位置对齐
    // Fabric 把 path 应用到文字时，默认是 path 的左上角对齐文字左上角。
    // 我们需要调整 path 的偏移，或者让 path 本身居中。

    // 让路径相对于文字居中
    // path.left = -width / 2
    // path.top = -height / 2 (大概)

    active.set({
      path: path
      // v6 中 pathSide/pathAlign 属性可能需要调整
      // pathSide: 'center', // 如果支持
      // pathAlign: 'center'
    })

    canvas.value.requestRenderAll()

    // 注意：修改 path 后，saveHistory 可能会导致 JSON 序列化变大，这是正常的
    // 节流保存
    // saveHistory()
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

  // index.vue -> script setup

  const handleClipImage = (type: string) => {
    if (!canvas.value) return
    const active = canvas.value.getActiveObject()
    if (!active || active.type !== 'image') return

    // 1. 还原
    if (type === 'none') {
      active.set({ clipPath: null, dirty: true })
      canvas.value.requestRenderAll()
      saveHistory()
      return
    }

    let clipObj: any = null
    const width = active.width
    const height = active.height
    const size = Math.min(width, height) / 2

    const common = {
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0,
      absolutePositioned: false,
      // 🟢 [关键] 给每个蒙版加个身份证，方便 UI 回显
      data: { clipName: type }
    }

    if (type === 'circle') {
      clipObj = new fabric.value.Circle({
        ...common,
        radius: size
      })
    } else if (type === 'rounded') {
      clipObj = new fabric.value.Rect({
        ...common,
        width: width,
        height: height,
        rx: Math.min(width, height) * 0.15,
        ry: Math.min(width, height) * 0.15
      })
    } else if (type === 'heart') {
      // 简单的爱心路径
      const heartSVG =
        'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
      clipObj = new fabric.value.Path(heartSVG, { ...common })
      // 适配大小
      const bounds = clipObj.getBoundingRect()
      const scale = (Math.min(width, height) / Math.max(bounds.width, bounds.height)) * 0.9
      clipObj.scale(scale)
      // 修正中心偏移
      const center = clipObj.getCenterPoint()
      clipObj.left = -center.x
      clipObj.top = -center.y
    } else if (type === 'star') {
      // 五角星逻辑
      const makeStar = (r: number) => {
        const p = []
        for (let i = 0; i < 5; i++) {
          p.push({
            x: r * Math.cos(((18 + i * 72) * Math.PI) / 180),
            y: -r * Math.sin(((18 + i * 72) * Math.PI) / 180)
          })
          p.push({
            x: 0.5 * r * Math.cos(((54 + i * 72) * Math.PI) / 180),
            y: -0.5 * r * Math.sin(((54 + i * 72) * Math.PI) / 180)
          })
        }
        return p
      }
      clipObj = new fabric.value.Polygon(makeStar(size), { ...common })
    }

    if (clipObj) {
      active.set('clipPath', clipObj)
      // 清空圆角，避免冲突
      active.set('corners', 0)

      canvas.value.requestRenderAll()
      saveHistory()
      triggerRef(activeObject) // 强制刷新 Vue 状态
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

  // 1. [修改] 原有的 addGuide (通过按钮添加，默认居中)
  const addGuide = (direction: 'h' | 'v') => {
    if (!canvas.value) return
    const center = canvas.value.getVpCenter()
    // 垂直居中 或者 水平居中
    const pos = direction === 'h' ? center.y : center.x
    createGuideLine(direction, pos)
  }

  // 2. [新增] 响应标尺拖拽添加
  const handleAddGuideAt = ({ axis, position }: { axis: 'h' | 'v'; position: number }) => {
    createGuideLine(axis, position)
  }

  // 3. [提取] 核心创建逻辑
  const createGuideLine = (direction: 'h' | 'v', position: number) => {
    if (!canvas.value) return

    // 辅助线非常长，超出画布也没关系
    const limit = 5000
    let points: [number, number, number, number] = [0, 0, 0, 0]
    let props = {}

    if (direction === 'h') {
      points = [-limit, position, limit, position]
      props = {
        lockMovementX: true,
        lockMovementY: false,
        cursor: 'ns-resize'
      }
    } else {
      points = [position, -limit, position, limit]
      props = {
        lockMovementX: false,
        lockMovementY: true,
        cursor: 'ew-resize'
      }
    }

    const line = new fabric.value.Line(points, {
      ...props,
      stroke: '#06b6d4',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: true,
      evented: true,
      excludeFromExport: true,
      hoverCursor: props.cursor,
      data: { isGuide: true },
      // 确保在任何图层之上
      perPixelTargetFind: true
    })

    canvas.value.add(line)
    canvas.value.setActiveObject(line)

    // 如果是通过拖拽创建的，最好立即触发拖拽模式（可选，Fabric API 比较复杂，暂不实现自动吸附鼠标）
    // 但可以简单地让他处于选中状态

    canvas.value.requestRenderAll()
    saveHistory()
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
    if (item.type === 'path') {
      // 处理 SVG 路径
      const path = new fabric.value.Path(item.path, {
        ...common, // 包含 left, top, fill 等
        scaleX: 1,
        scaleY: 1
      })

      // 自动缩放到指定大小 (Fabric Path 默认大小取决于 path 字符串的坐标)
      // 如果素材里配置了 width，我们就强制缩放过去
      if (item.width) {
        path.scaleToWidth(item.width)
      }

      return path
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
    } else if (item.type === 'path') {
      const path = new fabric.value.Path(item.path, {
        ...commonProps,
        fill: item.fill || '#000000',
        scaleX: 1,
        scaleY: 1
      })
      if (item.width) path.scaleToWidth(item.width)

      canvas.value.add(path)
      canvas.value.setActiveObject(path)
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

  // --- 设置背景颜色 (支持纯色和渐变) ---
  // --- 设置背景颜色 (修复版：支持渐变渲染) ---
  const setBackgroundColor = (value: string | any) => {
    if (!canvas.value) return

    // 1. 清除背景图片
    canvas.value.backgroundImage = null

    // 获取画布的实际宽高 (关键修正)
    const w = canvas.value.width
    const h = canvas.value.height

    // 2. 判断类型
    if (typeof value === 'string') {
      // === A. 纯色 ===
      canvas.value.backgroundColor = value
    } else if (typeof value === 'object' && value.type === 'gradient') {
      // === B. 渐变 ===
      const { start, end, angle } = value

      // 计算像素坐标 (使用 w 和 h，而不是 0 和 1)
      let coords = { x1: 0, y1: 0, x2: 0, y2: h } // 默认垂直 (90度)

      // 简单的角度映射
      if (angle === 0 || angle === 360) {
        // 左 -> 右
        coords = { x1: 0, y1: 0, x2: w, y2: 0 }
      } else if (angle === 90) {
        // 上 -> 下
        coords = { x1: 0, y1: 0, x2: 0, y2: h }
      } else if (angle === 180) {
        // 右 -> 左
        coords = { x1: w, y1: 0, x2: 0, y2: 0 }
      } else if (angle === 270) {
        // 下 -> 上
        coords = { x1: 0, y1: h, x2: 0, y2: 0 }
      } else if (angle === 45) {
        // 左上 -> 右下
        coords = { x1: 0, y1: 0, x2: w, y2: h }
      } else if (angle === 135) {
        // 右上 -> 左下
        coords = { x1: w, y1: 0, x2: 0, y2: h }
      } else {
        // 其他角度默认垂直，防止不显示
        coords = { x1: 0, y1: 0, x2: 0, y2: h }
      }

      // 创建渐变对象
      const gradient = new fabric.value.Gradient({
        type: 'linear',
        // 🔴 [移除] gradientUnits: 'percentage', 不要用这个
        coords: coords, // 使用像素坐标
        colorStops: [
          { offset: 0, color: start },
          { offset: 1, color: end }
        ]
      })

      // 应用给背景
      canvas.value.backgroundColor = gradient
    }

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
  // [新增] 控制导出弹窗显示
  const showExport = ref(false)
  // 1. [修改] 原来的 downloadImage 函数，现在只负责打开弹窗
  const downloadImage = () => {
    showExport.value = true
  }
  // 2. [新增] 真正执行导出的函数 (由 ExportDialog 触发)
  const handleExportConfirm = ({ format, quality, multiplier }: any) => {
    if (!canvas.value) return

    // 1. 退出所有替身模式 (确保导出的不是虚线框)
    exitAllProxyModes()

    // 2. 导出数据
    const dataURL = canvas.value.toDataURL({
      format: format, // 'png', 'jpeg', 'webp'
      quality: quality, // 0.1 - 1
      multiplier: multiplier, // 1x, 2x, 4x
      enableRetinaScaling: true // 适配视网膜屏
    })

    // 3. 创建下载链接
    const link = document.createElement('a')
    link.download = `design-${Date.now()}.${format}`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`导出成功 (${multiplier}x ${format.toUpperCase()})`)
  }
  // index.vue

  // --- [新增] 均分/分布逻辑 ---
  const distributeObjects = (direction: 'horizontal' | 'vertical') => {
    const active = canvas.value?.getActiveObject()
    // 必须是多选模式
    if (!active || active.type !== 'activeselection') {
      toast.error('请先框选多个元素')
      return
    }

    // 获取选区内的所有对象
    const objects = active.getObjects()
    if (objects.length < 3) {
      toast.error('至少需要选 3 个元素才能均分')
      return
    }

    // 1. 获取选区的边界，用于重新计算位置
    // 注意：在 ActiveSelection 中，对象的 left/top 是相对于选区中心的
    // 我们需要操作的是 objects 数组

    if (direction === 'horizontal') {
      // === 水平分布 ===

      // A. 按视觉位置从左到右排序
      // (obj.left 是相对选区中心的，但这不影响排序)
      objects.sort((a: any, b: any) => a.left - b.left)

      // B. 获取第一个和最后一个（锚点不动）
      const first = objects[0]
      const last = objects[objects.length - 1]

      // C. 计算总可用宽度 (从第一个的左边 到 最后一个的左边)
      // 这里我们使用 "等间距 (Distribute Centers)" 还是 "等间隙 (Distribute Spacing)"?
      // 通常 "等间隙" 更常用（物体间距一致）。

      // 计算所有物体的总宽度 (不包含第一个和最后一个，因为它们是边界)
      // 算法：
      // totalDistance = (Last.left - First.left)
      // gap = totalDistance / (count - 1) -> 这是 "中心点均分" 或 "左边缘均分"

      // 我们实现 "Left 边缘均分" (最简单且常用)：
      // 即：第 i 个对象的 left = 第 0 个 left + i * gap

      const totalDist = last.left - first.left
      const step = totalDist / (objects.length - 1)

      objects.forEach((obj: any, index: number) => {
        // 跳过第一个和最后一个，其实算也可以，反正位置不变
        if (index === 0 || index === objects.length - 1) return

        const newLeft = first.left + index * step
        obj.set('left', newLeft)
      })
    } else {
      // === 垂直分布 ===

      // A. 从上到下排序
      objects.sort((a: any, b: any) => a.top - b.top)

      const first = objects[0]
      const last = objects[objects.length - 1]

      const totalDist = last.top - first.top
      const step = totalDist / (objects.length - 1)

      objects.forEach((obj: any, index: number) => {
        if (index === 0 || index === objects.length - 1) return

        const newTop = first.top + index * step
        obj.set('top', newTop)
      })
    }

    // 2. 关键：通知选区更新
    // 因为我们在选区内部改了子元素坐标，选区的边界框可能需要重新计算
    // 或者最简单的：保持选区框不变，只变内容
    active.setCoords()
    canvas.value.requestRenderAll()
    saveHistory()
    toast.success('已自动均分排列')
  }
  // index.vue

  // index.vue -> script setup

  const handleRemoveBg = async () => {
    // 1. 关键：使用 toRaw 获取原始对象，避开 Vue 代理干扰
    const active = toRaw(canvas.value?.getActiveObject())
    if (!active || active.type !== 'image') return

    const originalSrc = active.getSrc()

    try {
      isRemovingBg.value = true
      toast.info('AI 正在智能抠图...', { duration: 2000 })

      // 2. AI 运算
      const blob = await removeBackground(originalSrc)
      const newSrc = URL.createObjectURL(blob)

      // 3. 定义刷新逻辑 (独立函数)
      const refreshImage = () => {
        // A. 强制标记脏状态，不仅是 dirty，还要清除缓存
        active.set('dirty', true)
        active.set('objectCaching', false) // 暂时关闭缓存，确保重绘

        // B. 重新计算尺寸 (因为抠图后透明区域可能变了，但我们希望维持原大小)
        // active.scaleToWidth(active.getScaledWidth()) // 可选：保持视觉宽度

        // C. 暴力重绘
        active.setCoords()
        canvas.value.renderAll() // 使用 renderAll 而不是 requestRenderAll

        // D. 恢复缓存 (延时一下，性能优化)
        setTimeout(() => {
          active.set('objectCaching', true)
        }, 500)

        // E. 更新状态
        isRemovingBg.value = false
        toast.success('抠图完成！')

        // F. 触发 Vue 更新
        saveHistory()
        triggerRef(activeObject)
      }

      // 4. 执行替换 (兼容 Fabric v5 和 v6)
      // v6 中 setSrc 返回 Promise，v5 使用第二个参数作为回调
      const ret = active.setSrc(
        newSrc,
        () => {
          // 这是 v5 的回调，或者 v6 也会兼容调用
          refreshImage()
        },
        {
          crossOrigin: 'anonymous'
        }
      )

      // 如果是 v6，setSrc 返回的是 Promise，我们需要 await 它
      // 这样能确保图片真的加载进内存了
      if (ret && typeof ret.then === 'function') {
        await ret
        // Promise resolve 后再次确保刷新 (双重保险)
        refreshImage()
      }
    } catch (error) {
      console.error('抠图失败:', error)
      isRemovingBg.value = false
      toast.error('处理失败，请重试')
    }
  }

  // index.vue

  // [新增] 样式剪贴板
  let _styleClipboard: any = null

  // [新增] 复制样式
  const copyStyle = () => {
    const active = canvas.value?.getActiveObject()
    if (!active) return

    // 定义要复制的属性白名单 (外观属性)
    // 不复制 left, top, width, height, text(内容) 等
    const styleProps = [
      'fill',
      'stroke',
      'strokeWidth',
      'strokeDashArray',
      'opacity',
      'shadow',
      'visible',
      'backgroundColor',
      'fillRule',
      'paintFirst',
      'globalCompositeOperation',
      // 特定类型属性
      'fontFamily',
      'fontWeight',
      'fontSize',
      'fontStyle',
      'underline',
      'linethrough',
      'textAlign',
      'charSpacing',
      'lineHeight',
      'rx',
      'ry', // 圆角
      'filters' // 滤镜
    ]

    // 获取对象的所有属性
    const objectConfig = active.toObject(styleProps)

    // 筛选出样式属性
    const style: any = {}
    styleProps.forEach(prop => {
      if (objectConfig[prop] !== undefined) {
        style[prop] = objectConfig[prop]
      }
    })

    // 特殊处理滤镜 (因为滤镜是实例，toObject 后是对象，粘贴时需要重建)
    // Fabric 的 toObject 会自动处理 filters，但 apply 时可能需要 restore
    // 简单起见，我们暂存 filters 数组

    _styleClipboard = style
    toast.success('样式已复制')
  }

  // [新增] 粘贴样式
  const pasteStyle = () => {
    const active = canvas.value?.getActiveObject()
    if (!active || !_styleClipboard) return

    // 1. 应用基础属性
    active.set(_styleClipboard)

    // 2. 特殊处理：滤镜重建 (如果直接 set filters 数组，可能不会变成实例)
    // Fabric 的 set 方法通常不够聪明来重建 Filter 实例，需要手动处理
    /*
     注意：如果你发现滤镜粘贴过去失效，需要在这里遍历 _styleClipboard.filters
     然后 new fabric.Image.filters.Grayscale() 这样重建。
     为了代码简洁，这里假设 Fabric v6 的 set() 足够智能 (通常是的)。
  */

    // 3. 特殊处理：如果是文字，fontSize 可能会导致位置偏移，需要重新 setCoords

    // 4. 刷新
    active.setCoords()
    canvas.value.requestRenderAll()
    saveHistory()
    triggerRef(activeObject) // 刷新右侧面板 UI
    toast.success('样式已粘贴')
  }
  // ... 其他函数 ...

  // pages/index.vue

  // 🟢 [修复增强版] 设置文字图片纹理
  const handleTextTexture = (file: File | null) => {
    const active = canvas.value?.getActiveObject()

    // 1. 检查是否选中了文字
    if (!active || !['i-text', 'text', 'textbox'].includes(active.type)) {
      // 也可以加个提示
      // toast.error('请先选中文字')
      return
    }

    // 2. 情况 A: 清除纹理 (恢复默认色)
    if (!file) {
      active.set('fill', '#000000') // 恢复为黑色或原色
      canvas.value.requestRenderAll()
      saveHistory()
      triggerRef(activeObject)
      return
    }

    // 3. 情况 B: 设置图片纹理
    const reader = new FileReader()
    reader.onload = f => {
      const data = f.target?.result as string

      // 使用原生 Image 对象加载，更稳健
      const img = new Image()
      img.src = data

      img.onload = () => {
        // 计算缩放比例：让图片的高度大约等于文字的高度
        // 这样纹理就能完整显示在文字里，而不是只显示一个角落
        const textHeight = active.height * active.scaleY
        // 如果图片比文字大，就缩小它；否则保持原样 (防止太糊)
        let scale = 1
        if (img.height > textHeight) {
          scale = textHeight / img.height
        }

        // 创建 Pattern 对象
        // 注意：Fabric v6 可能需要 fabric.value.Pattern，视你的导入方式而定
        const PatternClass = fabric.value.Pattern || fabric.value.FabricPattern

        const pattern = new PatternClass({
          source: img,
          repeat: 'repeat'
          // 💡 关键：设置 patternTransform 来缩放图片
          // 格式通常是矩阵 [scaleX, 0, 0, scaleY, offsetX, offsetY]
          // 这里我们简单做等比缩放
          // 注意：不同版本的 Fabric 对 patternTransform 的支持不同
          // 如果这行报错，可以注释掉，但这会影响大图的显示效果
        })

        // 手动挂载 transformMatrix (Fabric Pattern 的缩放有时需要这样设置)
        // [scaleX, skewY, skewX, scaleY, translateX, translateY]
        pattern.patternTransform = [scale, 0, 0, scale, 0, 0]

        // 应用填色
        active.set({
          fill: pattern,
          dirty: true, // 标记为“脏”，强制刷新缓存
          objectCaching: false // 暂时关闭缓存，确保立即看到效果
        })

        // 渲染
        canvas.value.requestRenderAll()

        // 恢复缓存 (延时一下优化性能)
        setTimeout(() => {
          if (active) active.set('objectCaching', true)
        }, 500)

        saveHistory()
        triggerRef(activeObject) // 刷新右侧 UI
      }
    }
    reader.readAsDataURL(file)
  }
  // 🟢 [新增] 处理复位视图
  const handleResetView = () => {
    // 调用之前写好的 autoFit
    // 这会自动计算缩放比例并居中
    autoFit()

    // 如果你还想强制重置平移量 (translate 0,0)
    // 需要调用 workspace 组件里的方法
    if (workspaceRef.value) {
      workspaceRef.value.resetView() // 这个方法会将 translate 重置为 0
    }
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
      @add-guide="addGuide"
      @reset-view="handleResetView" />

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
        @workspace-resize="handleWorkspaceResize"
        @add-guide-at="handleAddGuideAt" />

      <EditorSettings
        :active-object="activeObject"
        :is-removing-bg="isRemovingBg"
        @update-prop="updateProp"
        @change-layer="changeLayer"
        @delete="deleteActive"
        @toggle-style="toggleStyle"
        @update-image-radius="handleImageRadius"
        @group="groupObjects"
        @ungroup="ungroupObjects"
        @align="alignObject"
        @update-filter="handleImageFilter"
        @set-as-bg="handleSetBackground"
        @update-text-curve="handleTextCurve"
        @update-shadow="handleSetShadow"
        @update-shadow-prop="handleUpdateShadowProp"
        @update-clip="handleClipImage"
        @distribute="distributeObjects"
        @remove-bg="handleRemoveBg"
        @update-text-texture="handleTextTexture" />

      <ContextMenu
        :visible="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :selection-type="activeObject?.type"
        :has-selection="!!activeObject"
        :is-group="activeObject?.type === 'group'"
        @close="contextMenu.visible = false"
        @action="handleMenuAction" />
      <!-- 🟢 [新增] 导出弹窗 (放在这里，覆盖在最上层) -->
      <ExportDialog :visible="showExport" @close="showExport = false" @confirm="handleExportConfirm" />
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
