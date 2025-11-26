<script setup lang="ts">
  import { ref, onBeforeUnmount, shallowRef } from 'vue'
  import EditorHeader from '~/components/EditorHeader.vue'
  import EditorSidebar from '~/components/EditorSidebar.vue'
  import EditorWorkspace from '~/components/EditorWorkspace.vue'
  import EditorSettings from '~/components/EditorSettings.vue'
  import ContextMenu from '~/components/ContextMenu.vue' // [新增]
  // --- 数据 (Assets) ---
  const assets = {
    templates: [
      {
        id: 'promo',
        label: '促销海报',
        preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        data: {
          background: '#FFF1F2',
          objects: [
            // 注意：这里是 Fabric 对象结构
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
        label: '招聘模版',
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
              content: '虚位以待\n诚聘精英',
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
    colors: ['#FFFFFF', '#FEF3C7', '#DBEAFE', '#FEE2E2', '#ECFCCB', '#1F2937'],
    elements: [
      { type: 'shape', shape: 'rect', color: '#F87171' },
      { type: 'shape', shape: 'circle', color: '#60A5FA' },
      { type: 'shape', shape: 'triangle', color: '#34D399' },
      // 这里的 url 需要是允许跨域的图片，否则会导致画布污染无法导出
      { type: 'image', url: 'https://cdn-icons-png.flaticon.com/512/1046/1046283.png' }
    ],
    text: [
      { type: 'text', content: '主标题', fontSize: 60, fontWeight: 'bold' },
      { type: 'text', content: '正文内容', fontSize: 24, fontWeight: 'normal' }
    ]
  }

  // --- 状态 ---
  const canvas = shallowRef<any>(null)
  const fabric = shallowRef<any>(null)
  const activeObject = ref<any>(null)
  const zoomLevel = ref(100)
  const historyStack = ref<string[]>([])
  const historyIndex = ref(-1)
  let isHistoryProcessing = false
  // [新增] 剪贴板与右键菜单状态
  let _clipboard: any = null
  const contextMenu = ref({ visible: false, x: 0, y: 0 })

  // --- 初始化 ---
  const initCanvas = async (canvasEl: HTMLCanvasElement) => {
    const fabricModule = await import('fabric')
    fabric.value = fabricModule.default || fabricModule

    canvas.value = new fabric.value.Canvas(canvasEl, {
      width: 600,
      height: 800,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      isDrawingMode: false // 初始必须是 false
    })

    // 【关键修复】显式初始化画笔！
    // Fabric v6 可能不会自动创建这个实例，需要我们手动创建
    const brush = new fabric.value.PencilBrush(canvas.value)
    brush.width = 5
    brush.color = '#000000'
    canvas.value.freeDrawingBrush = brush
    canvas.value.on('selection:created', updateActiveObject)
    canvas.value.on('selection:updated', updateActiveObject)
    canvas.value.on('selection:cleared', () => (activeObject.value = null))
    canvas.value.on('object:modified', saveHistory)
    canvas.value.on('object:added', () => !isHistoryProcessing && saveHistory())
    // [新增] 监听画完一笔的事件 (保存历史)
    canvas.value.on('path:created', () => {
      saveHistory()
    })
    // [新增] 右键菜单事件
    canvas.value.upperCanvasEl.addEventListener('contextmenu', handleContextMenu)

    // [新增] 智能吸附 (Smart Guides)
    setupSmartGuides()
    saveHistory()
    window.addEventListener('keydown', handleKeydown)
  }

  onBeforeUnmount(() => {
    canvas.value?.dispose()
    window.removeEventListener('keydown', handleKeydown)
  })
  // --- [新增] 画笔控制逻辑 ---
  const setDrawingMode = (isDrawing: boolean) => {
    // 必须确保 canvas 存在
    if (!canvas.value) return

    canvas.value.isDrawingMode = isDrawing

    if (isDrawing) {
      // 切换到画笔模式时，取消当前选中，避免出现蓝色选框干扰
      canvas.value.discardActiveObject()
      canvas.value.requestRenderAll()

      // 再次确保画笔实例存在（双重保险）
      if (!canvas.value.freeDrawingBrush) {
        const brush = new fabric.value.PencilBrush(canvas.value)
        brush.width = 5
        brush.color = '#000000'
        canvas.value.freeDrawingBrush = brush
      }
    }
  }

  const setBrushColor = (color: string) => {
    // 【关键修复】检查 freeDrawingBrush 是否存在
    if (!canvas.value || !canvas.value.freeDrawingBrush) return
    canvas.value.freeDrawingBrush.color = color
  }

  const setBrushWidth = (width: number) => {
    // 【关键修复】检查 freeDrawingBrush 是否存在
    if (!canvas.value || !canvas.value.freeDrawingBrush) return
    canvas.value.freeDrawingBrush.width = width
  }
  // --- [新增] 智能吸附逻辑 ---
  // --- [修复] 智能吸附逻辑 ---
  const setupSmartGuides = () => {
    // 用于临时存储需要画线的坐标，格式：{ x1, y1, x2, y2 }
    let guidlelines: any[] = []

    // 1. 监听移动：只负责计算位置，不负责画线
    canvas.value.on('object:moving', (e: any) => {
      const obj = e.target
      const canvasWidth = canvas.value.width
      const canvasHeight = canvas.value.height

      // 重置辅助线数据
      guidlelines = []

      const snapDist = 10 // 吸附距离
      let snapped = false

      // --- 垂直居中吸附 ---
      if (Math.abs(obj.left - canvasWidth / 2) < snapDist) {
        obj.set({ left: canvasWidth / 2 })
        obj.setCoords()
        snapped = true
        // 记录需要画垂直线
        guidlelines.push({
          x1: canvasWidth / 2,
          y1: 0,
          x2: canvasWidth / 2,
          y2: canvasHeight
        })
      }

      // --- 水平居中吸附 ---
      if (Math.abs(obj.top - canvasHeight / 2) < snapDist) {
        obj.set({ top: canvasHeight / 2 })
        obj.setCoords()
        snapped = true
        // 记录需要画水平线
        guidlelines.push({
          x1: 0,
          y1: canvasHeight / 2,
          x2: canvasWidth,
          y2: canvasHeight / 2
        })
      }

      // 即使没吸附，也要触发渲染，以便清除之前的线
      if (!snapped) {
        // 不需要做额外操作，guidlelines 已清空，renderAll 会清除旧线
      }
    })

    // 2. 监听渲染后：专门负责画线 (这才是能在屏幕上留住线的关键)
    canvas.value.on('after:render', () => {
      if (guidlelines.length === 0) return

      const ctx = canvas.value.getContext()
      ctx.save()
      ctx.strokeStyle = '#666' // 1. 改成纯红色
      ctx.lineWidth = 1 // 线宽
      ctx.setLineDash([4, 4]) // 2. 关键：设置虚线模式 [实线长度, 间隙长度]

      // 遍历所有需要画的线
      guidlelines.forEach((line: any) => {
        ctx.beginPath()
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
        ctx.stroke()
      })

      ctx.restore()
    })

    // 3. 鼠标松开时，清空辅助线
    canvas.value.on('mouse:up', () => {
      guidlelines = []
      canvas.value.requestRenderAll()
    })
  }

  // --- [新增] 右键菜单逻辑 ---
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    // 判断点击的是否在选中元素上（Fabric 处理了选中逻辑，我们只需看是否有 activeObject）
    // 也可以用 canvas.value.findTarget(e) 精确判断

    contextMenu.value = {
      visible: true,
      x: e.clientX,
      y: e.clientY
    }
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
  }

  // --- [新增] 复制/粘贴/组合/解组 ---
  const copy = async () => {
    const active = canvas.value.getActiveObject()
    if (active) {
      // Fabric v6: clone() 返回 Promise
      active.clone().then((cloned: any) => {
        _clipboard = cloned
      })
    }
  }

  const paste = async () => {
    if (!_clipboard) return

    // Fabric v6: clone() 返回 Promise
    _clipboard.clone().then((clonedObj: any) => {
      canvas.value.discardActiveObject()

      clonedObj.set({
        left: clonedObj.left + 20,
        top: clonedObj.top + 20,
        evented: true
      })

      if (clonedObj.type === 'activeSelection') {
        // 粘贴多选组需要特殊处理：重建选区
        clonedObj.canvas = canvas.value
        clonedObj.forEachObject((obj: any) => canvas.value.add(obj))
        clonedObj.setCoords()
      } else {
        canvas.value.add(clonedObj)
      }

      // 偏移剪贴板位置，以便连续粘贴
      _clipboard.top += 20
      _clipboard.left += 20

      canvas.value.setActiveObject(clonedObj)
      canvas.value.requestRenderAll()

      // 强制更新 Vue 状态
      activeObject.value = clonedObj
      saveHistory()
    })
  }

  // --- 修复后的 组合/解组 ---
  const groupObjects = async () => {
    const active = canvas.value.getActiveObject()
    // 必须是 activeSelection (多选状态) 才能组合
    if (!active || active.type !== 'activeSelection') return

    // toGroup 会破坏当前的 activeSelection，生成一个新的 Group 对象
    const group = active.toGroup()

    // 关键：手动设置为当前选中对象
    canvas.value.setActiveObject(group)
    canvas.value.requestRenderAll()

    // 关键：通知 Vue 更新属性面板
    activeObject.value = group
    saveHistory()
  }

  const ungroupObjects = async () => {
    const active = canvas.value.getActiveObject()
    // 必须是 group 才能解组
    if (!active || active.type !== 'group') return

    // 解组后，Fabric 会自动选中拆分后的所有元素 (变为 activeSelection)
    const activeSelection = active.toActiveSelection()

    canvas.value.setActiveObject(activeSelection)
    canvas.value.requestRenderAll()

    // 通知 Vue 更新
    activeObject.value = activeSelection
    saveHistory()
  }

  const updateActiveObject = (e: any) => {
    activeObject.value = e.selected?.[0]
  }

  // --- 核心逻辑 ---
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

  // --- 【重点修改】应用模版 ---
  const applyTemplate = async (tpl: any) => {
    if (!canvas.value) return
    if (!confirm('应用模版会覆盖当前画布内容，确定吗？')) return

    isHistoryProcessing = true // 暂停历史记录，防止添加过程中频繁触发

    // 1. 清空画布
    canvas.value.clear()
    canvas.value.backgroundColor = tpl.data.background

    // 2. 遍历并重建对象
    // 我们不能用 addElement，因为那个函数是给"新建素材"用的（强制居中）
    // 这里我们要根据模版里存的具体坐标来还原
    for (const obj of tpl.data.objects) {
      let fabricObj = null

      // 提取通用属性 (坐标、原点、填充等)
      const baseProps = {
        left: obj.left,
        top: obj.top,
        fill: obj.fill,
        opacity: obj.opacity || 1,
        originX: 'center', // 模版数据最好统一中心点，如果模版数据是 left/top 原点，这里要去掉
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
        fabricObj = new fabric.value.Circle({
          ...baseProps,
          radius: obj.radius
        })
      }

      if (fabricObj) {
        canvas.value.add(fabricObj)
      }
    }

    // 3. 渲染并恢复历史记录
    canvas.value.requestRenderAll()
    isHistoryProcessing = false
    saveHistory() // 保存模版加载后的状态
  }
  // [新增] 处理拖拽放置
  const handleDropElement = ({ item, x, y }: { item: any; x: number; y: number }) => {
    if (!canvas.value) return

    // 1. 获取画布在屏幕上的位置
    // workspace 传来的 x,y 是相对于滚动容器的，我们需要转换成 Canvas 内部坐标
    // 最简单的方法是利用 Fabric 的 getPointer 或者 vptCoords

    // 由于我们是在父容器 drop 的，坐标转换稍微有点复杂。
    // 为了简化，我们直接利用 Fabric 的机制：
    // 这里的 x, y 是相对于那个 flex-center 容器的
    // 我们需要减去 Canvas DOM 元素本身的偏移量

    // 获取 Canvas 元素的实际 DOM 位置
    const canvasEl = canvas.value.upperCanvasEl
    const rect = canvasEl.getBoundingClientRect()

    // 计算鼠标相对于 Canvas 左上角的真实像素位置
    // e.clientX (全局) - rect.left (Canvas左边)
    // 但这里我们只拿到了 workspace 传来的相对坐标，这种传参方式不够精确。

    // --- 更好的做法：重新计算 ---
    // 我们其实不需要 workspace 传 x/y，我们只需要 item，
    // 因为 drop 事件发生时，我们无法在父组件拿到 event 对象。

    // 修正方案：
    // 我们直接在 addElement 函数里增加 x, y 参数
    addElement(item, x, y)
  }
  // --- 添加新元素 (侧边栏点击) ---
  // --- DesignEditor.vue ---

  // [修改] addElement 函数，支持传入坐标 (dropX, dropY 为屏幕绝对坐标 e.clientX/Y)
  const addElement = (item: any, dropX?: number, dropY?: number) => {
    if (!canvas.value) return

    let left, top

    // 判断是“拖拽放下”还是“点击添加”
    if (dropX !== undefined && dropY !== undefined) {
      // 1. 获取 Canvas 元素在网页上的位置
      const canvasRect = canvas.value.upperCanvasEl.getBoundingClientRect()

      // 2. 计算鼠标相对于 Canvas 左上角的偏移 (像素)
      const mouseX = dropX - canvasRect.left
      const mouseY = dropY - canvasRect.top

      // 3. 处理 Canvas 的缩放和平移 (Viewport Transform)
      // 这是为了确保即使画布缩放了，拖进去的位置也是准的
      const vpt = canvas.value.viewportTransform
      if (vpt) {
        // 反转矩阵，将屏幕像素坐标转换回 Canvas 逻辑坐标
        const invertedVpt = fabric.value.util.invertTransform(vpt)
        const point = fabric.value.util.transformPoint({ x: mouseX, y: mouseY }, invertedVpt)
        left = point.x
        top = point.y
      } else {
        left = mouseX
        top = mouseY
      }
    } else {
      // 默认点击添加：放在画布视口中心
      const center = canvas.value.getCenter()
      // getCenter 返回的是逻辑坐标，直接用即可
      // 但为了让用户看到新元素，最好根据当前的 viewport 调整一下（可选，这里先用简单居中）
      // fabric v6: canvas.getVpCenter() 可能更准
      const vpCenter = canvas.value.getVpCenter()
      left = vpCenter.x
      top = vpCenter.y
    }

    const commonProps = { left, top, originX: 'center', originY: 'center' }

    // --- 根据类型创建对象 ---
    if (item.type === 'text') {
      const text = new fabric.value.IText(item.content, {
        ...commonProps,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight,
        fontFamily: 'Arial',
        fill: '#333333'
      })
      canvas.value.add(text)
      canvas.value.setActiveObject(text)
    } else if (item.type === 'shape') {
      let shape
      const opts = { ...commonProps, fill: item.color, width: 100, height: 100 }

      if (item.shape === 'rect') shape = new fabric.value.Rect(opts)
      if (item.shape === 'circle') shape = new fabric.value.Circle({ ...opts, radius: 50 })
      if (item.shape === 'triangle') shape = new fabric.value.Triangle(opts)

      if (shape) {
        canvas.value.add(shape)
        canvas.value.setActiveObject(shape)
      }
    } else if (item.type === 'image') {
      // 图片加载是异步的
      fabric.value.FabricImage.fromURL(item.url, { crossOrigin: 'anonymous' })
        .then((img: any) => {
          if (!img) return

          img.set({ ...commonProps })

          // 限制图片大小，避免过大占满屏幕
          if (img.width > 300) {
            img.scaleToWidth(300)
          }

          canvas.value.add(img)
          canvas.value.setActiveObject(img)
          saveHistory() // 图片加载完需要手动存一次历史
        })
        .catch((err: any) => console.error('图片加载失败', err))
    }
  }

  // ... (handleUploadImage, setBackgroundColor, updateProp, toggleStyle, changeLayer, deleteActive, handleKeydown 等保持不变)

  const handleUploadImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = f => {
      const data = f.target?.result as string
      fabric.value.FabricImage.fromURL(data).then((img: any) => {
        if (!img) return
        const center = canvas.value.getCenter()
        img.set({ left: center.left, top: center.top, originX: 'center', originY: 'center' })
        if (img.width > canvas.value.width / 2) img.scaleToWidth(canvas.value.width / 2)
        canvas.value.add(img)
        canvas.value.setActiveObject(img)
        saveHistory()
      })
    }
    reader.readAsDataURL(file)
  }

  const setBackgroundColor = (color: string) => {
    canvas.value.backgroundColor = color
    canvas.value.requestRenderAll()
    saveHistory()
  }

  // --- 属性修改 ---
  const updateProp = ({ key, value }: { key: string; value: any }) => {
    const active = canvas.value?.getActiveObject()
    if (active) {
      // 1. 修改 Fabric 对象属性
      active.set(key, value)

      // 如果修改的是字号等改变大小的属性，最好更新一下坐标控制点
      if (key === 'fontSize' || key === 'scaleX' || key === 'scaleY') {
        active.setCoords()
      }

      // 2. 渲染画布
      canvas.value.requestRenderAll()

      // 3. 【关键修复】更新 Vue 状态
      // 我们不能只写 { ...active }，因为这样会丢失 active.type
      // 必须显式地把 type 属性赋值进去
      activeObject.value = {
        ...active,
        type: active.type, // <--- 这行代码修复了你的问题
        // 也可以加上 id，以防万一
        id: active.id
      }

      saveHistory()
    }
  }

  const toggleStyle = (style: 'bold' | 'italic') => {
    const active = canvas.value?.getActiveObject()
    if (!active || active.type !== 'i-text') return
    if (style === 'bold') active.set('fontWeight', active.fontWeight === 'bold' ? 'normal' : 'bold')
    if (style === 'italic') active.set('fontStyle', active.fontStyle === 'italic' ? 'normal' : 'italic')
    canvas.value.requestRenderAll()
    activeObject.value = { ...active }
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

  const deleteActive = () => {
    const active = canvas.value?.getActiveObject()
    if (active) {
      canvas.value.remove(active)
      canvas.value.discardActiveObject()
      canvas.value.requestRenderAll()
      activeObject.value = null
      saveHistory()
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!activeObject.value?.isEditing) deleteActive()
    }
    // [增强] Ctrl+C/V
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') {
        copy()
        e.preventDefault()
      }
      if (e.key === 'v') {
        paste()
        e.preventDefault()
      }
      if (e.key === 'z') {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
      }
      if (e.key === 'g') {
        e.preventDefault()
        e.shiftKey ? ungroupObjects() : groupObjects()
      } // Ctrl+G 组合
    }
  }

  const handleZoom = (delta: number) => {
    zoomLevel.value = Math.min(Math.max(zoomLevel.value + delta, 10), 200)
    canvas.value.setZoom(zoomLevel.value / 100)
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
      @undo="undo"
      @redo="redo"
      @save="saveProject"
      @download="downloadImage" />

    <div class="flex-1 flex overflow-hidden">
      <EditorSidebar
        :assets="assets"
        @add-element="addElement"
        @apply-template="applyTemplate"
        @set-bg-color="setBackgroundColor"
        @upload-image="handleUploadImage"
        @set-drawing-mode="setDrawingMode"
        @set-brush-color="setBrushColor"
        @set-brush-width="setBrushWidth" />

      <EditorWorkspace
        :zoom-level="zoomLevel"
        @canvas-ready="initCanvas"
        @update-zoom="handleZoom"
        @drop-element="handleDropElement" />

      <EditorSettings
        :active-object="activeObject"
        @update-prop="updateProp"
        @toggle-style="toggleStyle"
        @change-layer="changeLayer"
        @delete="deleteActive" />
      <!-- [新增] 右键菜单 -->
      <ContextMenu
        :visible="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :has-selection="!!activeObject"
        :is-group="activeObject?.type === 'group'"
        @close="contextMenu.visible = false"
        @action="handleMenuAction" />
    </div>
  </div>
</template>
