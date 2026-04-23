<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, toRaw, nextTick } from 'vue'
  import { toast } from 'vue-sonner'

  // 组件引用
  import EditorHeader from '~/components/EditorHeader.vue'
  import EditorSidebar from '~/components/EditorSidebar.vue'
  import EditorWorkspace from '~/components/EditorWorkspace.vue'
  import EditorSettings from '~/components/EditorSettings.vue'
  import ContextMenu from '~/components/ContextMenu.vue'
  import ExportDialog from '~/components/ExportDialog.vue'

  // Composables (功能模块)
  import { useCanvasCore } from '~/composables/editor/useCanvasCore'
  import { useLayerSystem } from '~/composables/editor/useLayerSystem'
  import { useTools } from '~/composables/editor/useTools'
  import { useObjectActions } from '~/composables/editor/useObjectActions'
  import { useImageEffects } from '~/composables/editor/useImageEffects'

  // =================================================================
  // 1. 初始化 Composables
  // =================================================================

  // 核心画布状态
  const {
    canvas,
    fabric,
    isReady,
    canvasSize,
    zoomLevel,
    showGrid,
    activeObject,
    assets,
    historyStack,
    historyIndex,
    saveHistory,
    undo,
    redo,
    autoFit,
    handleResize,
    handleZoom,
    updateActiveObject,
    toggleGrid,
    workspaceSize // 🟢 [修复] 补全变量
  } = useCanvasCore()

  // 图层系统 (注意：workspaceRef 从这里获取)
  const {
    layers,
    selectLayer,
    toggleLayerVisible,
    toggleLayerLock,
    toggleGroupExpand,
    handleLayerReorder,
    updateLayerList,
    activateProxyMode,
    workspaceRef // 🟢 [关键] 直接使用这里返回的 ref
  } = useLayerSystem(canvas, fabric, activeObject, saveHistory)

  // 工具箱 (钢笔、剪裁)
  const tools = useTools(canvas, fabric, saveHistory)

  // 对象操作 (添加、删除、组合)
  const objects = useObjectActions(canvas, fabric, activeObject, zoomLevel, saveHistory, updateLayerList)

  // 图片特效 (抠图、纹理)
  const effects = useImageEffects(canvas, fabric, activeObject, saveHistory)

  // =================================================================
  // 2. 本地 UI 状态
  // =================================================================
  const contextMenu = ref({ visible: false, x: 0, y: 0 })

  // 拖拽逻辑所需的临时变量
  let transformStart = { left: 0, top: 0 }
  let constraintAxis: 'h' | 'v' | null = null
  let isCopying = false
  // [新增] 记录文本选区，用于失去焦点后应用样式
  let lastSelection: { start: number; end: number } | null = null

  // =================================================================
  // 3. 画布初始化与事件绑定
  // =================================================================

  const initCanvas = async (canvasEl: HTMLCanvasElement) => {
    const fabricModule = await import('fabric')
    fabric.value = fabricModule.default || fabricModule

    // 创建 Canvas
    canvas.value = new fabric.value.Canvas(canvasEl, {
      width: canvasSize.value.width,
      height: canvasSize.value.height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true, // 保持层级
      selectionColor: 'rgba(79, 70, 229, 0.1)',
      selectionBorderColor: '#4f46e5'
    })

    // 初始化画笔
    canvas.value.freeDrawingBrush = new fabric.value.PencilBrush(canvas.value)
    canvas.value.freeDrawingBrush.width = 5
    canvas.value.freeDrawingBrush.color = '#000000'

    // 绑定所有事件
    bindEvents()

    // 启动智能吸附 (Smart Guides)
    setupSmartGuides()

    // 延迟显示以确保渲染正确
    setTimeout(() => {
      if (canvas.value && !canvas.value.disposed) {
        isReady.value = true
        handleResize(canvasSize.value)
        updateLayerList()
      }
    }, 500)
  }

  // --- 事件绑定汇总 ---
  const bindEvents = () => {
    const c = canvas.value

    // 基础 Fabric 事件
    // 🟢 监听选中事件
    c.on('selection:created', e => {
      lastSelection = null // [新增] 重置选区
      // 如果当前是马赛克模式，且选中的不是正在画的东西（虽然drawing模式下很难选中别的）
      // 但为了保险：
      if (effects.isMosaicBrushMode.value) {
        effects.exitMosaicMode()

        // 重新选中刚才点击的物体 (因为 exitMosaicMode 可能会重置画笔导致选中丢失)
        // c.setActiveObject(e.selected[0])
      }
      updateActiveObject(e)
    })
    c.on('selection:updated', () => {
      updateActiveObject()
    })
    c.on('selection:cleared', () => {
      activeObject.value = null
      lastSelection = null
    })
    c.on('object:modified', saveHistory)
    c.on('object:added', () => {
      updateLayerList()
      saveHistory()
    })
    c.on('object:removed', () => updateLayerList())

    // 缩放修正 (防止矩形圆角变形)
    c.on('object:scaling', (e: any) => {
      const obj = e.target
      if (obj.type === 'rect') {
        const width = obj.width * obj.scaleX
        const height = obj.height * obj.scaleY
        obj.set({ width, height, scaleX: 1, scaleY: 1 })
      }
    })

    // [新增] 监听文本选区变化
    c.on('text:selection:changed', (e: any) => {
      const t = e.target
      // 仅在编辑模式下记录选区，防止 blur 时触发的 selection 归零覆盖了有效选区
      if (t && (t.type === 'i-text' || t.type === 'textbox') && t.isEditing) {
        lastSelection = { start: t.selectionStart, end: t.selectionEnd }
      }
    })

    // --- 拖拽开始 (记录初始位置) ---
    c.on('before:transform', (e: any) => {
      const target = e.transform?.target
      if (target) {
        transformStart = { left: target.left, top: target.top }
        constraintAxis = null // 重置 Shift 锁定方向
      }
    })

    // --- 拖拽中 (Shift锁定 + Alt复制) ---
    // 注意：这里包含了之前的 Shift 和 Alt 逻辑，不能丢！
    c.on('object:moving', (e: any) => {
      const obj = e.target

      // 1. Alt + 拖拽复制
      if (e.e.altKey && !isCopying) {
        isCopying = true
        obj.clone().then((cloned: any) => {
          // 将克隆体留在原地
          cloned.set({
            left: transformStart.left,
            top: transformStart.top,
            evented: true,
            selectable: true
          })
          c.add(cloned)
          // 保持层级
          if (!obj.group) {
            const idx = c.getObjects().indexOf(obj)
            c.insertAt(cloned, idx)
          }
          c.requestRenderAll()
        })
      }

      // 2. Shift + 轴向锁定
      if (e.e.shiftKey) {
        const dx = Math.abs(obj.left - transformStart.left)
        const dy = Math.abs(obj.top - transformStart.top)

        if (!constraintAxis) {
          if (dx > 5 || dy > 5) {
            constraintAxis = dx > dy ? 'h' : 'v'
          }
        }

        if (constraintAxis === 'h') obj.set('top', transformStart.top)
        else if (constraintAxis === 'v') obj.set('left', transformStart.left)
      }
    })

    // --- 鼠标松开 ---
    c.on('mouse:up', () => {
      isCopying = false
    })

    // --- 鼠标按下 (工具分流) ---
    c.on('mouse:down', (opt: any) => {
      // 1. 剪裁模式：点击外部确认
      if (tools.isCropping.value) {
        if (opt.target !== tools.cropZone.value) tools.confirmCrop()
        return
      }
      // 2. 钢笔模式：绘制点
      if (tools.isPenMode.value) {
        const pointer = c.getPointer(opt.e)

        // 🟢 [修复] 使用 .value 访问
        if (tools.penPoints.value.length === 0) {
          // --- 第一个点 ---
          tools.penPoints.value.push(pointer)

          const l = new fabric.value.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: '#999',
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false // 建议设为 false，防止鼠标hover到线上干扰
          })

          tools.activeLine.value = l // 🟢 .value
          c.add(l)
        } else {
          // --- 后续点 ---
          tools.penPoints.value.push(pointer)

          // 固定上一条线
          if (tools.activeLine.value) {
            tools.activeLine.value.set({ strokeDashArray: null, stroke: '#333' })
            tools.penLines.value.push(tools.activeLine.value) // 🟢 .value
          }

          // 创建新的跟随线
          const l = new fabric.value.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: '#999',
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false
          })

          tools.activeLine.value = l // 🟢 .value
          c.add(l)
        }
      }
    })

    // --- 鼠标移动 (工具预览) ---
    c.on('mouse:move', (opt: any) => {
      // 🟢 [修复] 增加 .value 检查
      if (tools.isPenMode.value && tools.activeLine.value) {
        const p = c.getPointer(opt.e)
        tools.activeLine.value.set({ x2: p.x, y2: p.y }) // 🟢 .value
        c.requestRenderAll()
      }
    })

    // --- 鼠标双击 ---
    c.on('mouse:dblclick', (opt: any) => {
      // 1. 钢笔结束
      if (tools.isPenMode.value) {
        tools.finishPenDrawing()
        return
      }
      
      const target = toRaw(opt.target)
      if (!target) return

      // 2. 进入剪裁
      if (target.type === 'image') {
        tools.startCrop(target)
        return
      }

      // 3. 组穿透编辑
      if (target.type === 'group') {
        // 获取点击位置
        const pointer = c.getPointer(opt.e)
        
        // 递归寻找最深层的子元素
        const findDeepest = (group: any, point: any): any => {
          const objs = group.getObjects()
          // 从上往下找
          for (let i = objs.length - 1; i >= 0; i--) {
            const obj = objs[i]
            // 需要转换坐标点到对象的局部坐标空间进行判断，Fabric 的 containsPoint 处理了这点
            if (obj.containsPoint(point)) {
              if (obj.type === 'group') return findDeepest(obj, point)
              return { obj, parent: group }
            }
          }
          return null
        }

        const result = findDeepest(target, pointer)
        if (result) {
          activateProxyMode(result.obj, result.parent, true)
        }
      }
    })

    // --- 右键菜单 ---
    c.upperCanvasEl.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault()
      updateActiveObject() // 确保选中
      contextMenu.value = { visible: true, x: e.clientX, y: e.clientY }
    })
  }

  // =================================================================
  // 4. 智能吸附 (Smart Guides) - 逻辑找回
  // =================================================================
  const setupSmartGuides = () => {
    let guidelines: any[] = []
    const snapDist = 10

    canvas.value.on('object:moving', (e: any) => {
      // 如果按住了 Shift，禁用吸附
      if (e.e.shiftKey) {
        guidelines = []
        return
      }

      const obj = e.target
      const w = canvas.value.width
      const h = canvas.value.height
      const center = obj.getCenterPoint()

      guidelines = []
      let snapX = null,
        snapY = null,
        distX = snapDist,
        distY = snapDist

      // 定义参考线 (画布中心)
      const verticals = [{ x: w / 2 }, { x: 0 }, { x: w }]
      const horizontals = [{ y: h / 2 }, { y: 0 }, { y: h }]

      // 加入其他物体边缘作为参考
      canvas.value.getObjects().forEach((o: any) => {
        if (o === obj || !o.visible || o.data?.isGuide) return
        const oc = o.getCenterPoint()
        verticals.push({ x: oc.x })
        horizontals.push({ y: oc.y })
      })

      // 计算 X 吸附
      verticals.forEach(v => {
        if (Math.abs(center.x - v.x) < distX) {
          distX = Math.abs(center.x - v.x)
          snapX = v.x
        }
      })

      // 计算 Y 吸附
      horizontals.forEach(h => {
        if (Math.abs(center.y - h.y) < distY) {
          distY = Math.abs(center.y - h.y)
          snapY = h.y
        }
      })

      // 应用吸附并生成线
      if (snapX !== null) {
        obj.set({ left: snapX - (center.x - obj.left) }) // 修正位置
        guidelines.push({ x1: snapX, y1: 0, x2: snapX, y2: h })
      }
      if (snapY !== null) {
        obj.set({ top: snapY - (center.y - obj.top) })
        guidelines.push({ x1: 0, y1: snapY, x2: w, y2: snapY })
      }

      obj.setCoords()
    })

    // 绘制辅助线
    canvas.value.on('after:render', () => {
      if (!guidelines.length) return
      const ctx = canvas.value.getContext()
      ctx.save()
      const vpt = canvas.value.viewportTransform
      ctx.transform(...vpt)
      ctx.lineWidth = 1 / canvas.value.getZoom()
      ctx.strokeStyle = '#ff0077'
      ctx.setLineDash([4 / canvas.value.getZoom(), 4])
      guidelines.forEach(l => {
        ctx.beginPath()
        ctx.moveTo(l.x1, l.y1)
        ctx.lineTo(l.x2, l.y2)
        ctx.stroke()
      })
      ctx.restore()
    })

    canvas.value.on('mouse:up', () => {
      guidelines = []
    })
  }

  // =================================================================
  // 5. 键盘与其他交互
  // =================================================================

  const handleKeydown = (e: KeyboardEvent) => {
    const activeEl = document.activeElement?.tagName
    if (activeEl === 'INPUT' || activeEl === 'TEXTAREA') return

    // 钢笔模式按键
    if (tools.isPenMode.value) {
      if (e.key === 'Enter') {
        e.preventDefault()
        tools.finishPenDrawing()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        tools.exitPenMode()
      }
      return
    }
    // 剪裁模式按键
    if (tools.isCropping.value) {
      if (e.key === 'Enter') {
        e.preventDefault()
        tools.confirmCrop()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        tools.cancelCrop()
      }
      return
    }

    const active = activeObject.value

    // 删除
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (active && !active.isEditing) objects.deleteActive()
    }

    // 组合键 (Ctrl/Cmd)
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redo()
      }
      if (e.key === 'c') {
        e.preventDefault()
        objects.copy()
      }
      if (e.key === 'v') {
        e.preventDefault()
        objects.paste()
      }
      if (e.key === 'g' && !e.shiftKey) {
        e.preventDefault()
        objects.groupObjects()
      }
      if (e.key === 'g' && e.shiftKey) {
        e.preventDefault()
        objects.ungroupObjects()
      }
      if (e.key === 's') {
        e.preventDefault() /* save trigger */
      }
    }

    // 方向键微调
    if (active && !active.isEditing && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      const step = e.shiftKey ? 10 : 1
      if (e.key === 'ArrowUp') active.top -= step
      if (e.key === 'ArrowDown') active.top += step
      if (e.key === 'ArrowLeft') active.left -= step
      if (e.key === 'ArrowRight') active.left += step
      active.setCoords()
      canvas.value.requestRenderAll()
      saveHistory()
    }
  }

  // 右键菜单动作
  const handleMenuAction = (action: string) => {
    contextMenu.value.visible = false
    if (action === 'copy') objects.copy()
    if (action === 'paste') objects.paste()
    if (action === 'delete') objects.deleteActive()
    if (action === 'group') objects.groupObjects()
    if (action === 'ungroup') objects.ungroupObjects()
    if (action === 'layer-top') objects.changeLayer('top')
    if (action === 'layer-bottom') objects.changeLayer('bottom')
    // [新增] 处理设为背景
    if (action === 'set-bg') effects.handleSetBackground()
    // 🟢 [新增]
    if (action === 'copyStyle') objects.copyStyle()
    if (action === 'pasteStyle') objects.pasteStyle()
  }

  // 处理属性更新 (支持文本局部样式)
  const handleUpdateProp = (key: string, value: any) => {
    const active = toRaw(activeObject.value)
    // 如果是文本对象
    if (active && (active.type === 'i-text' || active.type === 'textbox')) {
      // 判断是否处于编辑状态，或者有残留的选区
      const isEditing = active.isEditing
      // 只有当选区存在且 start != end 时才认为是局部修改
      const hasSelection = lastSelection && lastSelection.start !== lastSelection.end

      // 仅针对支持局部样式的属性
      if (
        (isEditing || hasSelection) &&
        [
          'fill',
          'fontSize',
          'fontFamily',
          'fontWeight',
          'fontStyle',
          'underline',
          'linethrough',
          'overline',
          'backgroundColor'
        ].includes(key)
      ) {
        // 获取选区范围 (优先使用当前编辑状态，否则使用残留选区)
        const start = isEditing ? active.selectionStart : lastSelection ? lastSelection.start : 0
        const end = isEditing ? active.selectionEnd : lastSelection ? lastSelection.end : 0

        // 再次校验范围
        // 如果有选区(start!=end) 或者 正在编辑中(isEditing, 此时可能是光标样式)，都走局部样式逻辑
        if (start !== end || isEditing) {
          // 临时恢复选区以确保样式应用正确
          const prevStart = active.selectionStart
          const prevEnd = active.selectionEnd

          active.selectionStart = start
          active.selectionEnd = end

          // 针对 fontSize 确保转换为数字，避免字符串导致样式失效
          const finalValue = key === 'fontSize' ? Number(value) : value
          active.setSelectionStyles({ [key]: finalValue })

          // 恢复 (如果不在编辑模式，其实无所谓，但为了安全)
          active.selectionStart = prevStart
          active.selectionEnd = prevEnd

          active.set('dirty', true)
          // 如果修改了字体大小，文字总宽度会变，需要更新控制点
          if (key === 'fontSize') {
            active.setCoords()
          }
          canvas.value.requestRenderAll()
          saveHistory()
          return
        }
      }
    }
    objects.updateProp(key, value)
  }

  const showExport = ref(false)
  const downloadImage = () => {
    showExport.value = true
  }
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

  // 生命周期
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
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

  // 1. [修改] 原有的 addGuide (通过按钮添加，默认居中)
  const addGuide = (direction: 'h' | 'v') => {
    if (!canvas.value) return
    const center = canvas.value.getVpCenter()
    // 垂直居中 或者 水平居中
    const pos = direction === 'h' ? center.y : center.x
    createGuideLine(direction, pos)
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
  let isHistoryProcessing = false
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
      <!-- 🟢 [修复] layers.value 改为 layers -->
      <EditorSidebar
        :assets="assets"
        :layers="layers"
        :is-pen-mode="tools.isPenMode.value"
        @toggle-pen-mode="tools.togglePenMode"
        @add-element="objects.addElement"
        @apply-template="applyTemplate"
        @set-drawing-mode="tools.setDrawingMode"
        @select-layer="selectLayer"
        @set-brush-color="tools.setBrushColor"
        @set-brush-width="tools.setBrushWidth"
        @toggle-layer-visible="toggleLayerVisible"
        @toggle-layer-lock="toggleLayerLock"
        @toggle-group-expand="toggleGroupExpand"
        @reorder-layer="handleLayerReorder"
        @set-bg-color="effects.setBackgroundColor"
        @upload-image="handleUploadImage" />

      <!-- 🟢 [关键] 绑定 workspaceRef -->
      <EditorWorkspace
        ref="workspaceRef"
        :is-loaded="isReady"
        :zoom-level="zoomLevel"
        :show-grid="showGrid"
        @canvas-ready="initCanvas"
        @update-zoom="handleZoom"
        @drop-element="p => objects.addElement(p.item, p.x, p.y)"
        @workspace-resize="s => (workspaceSize = s)"
        @add-guide-at="p => objects.createGuideLine(p.axis, p.position)" />

      <EditorSettings
        :active-object="activeObject"
        :is-removing-bg="effects.isRemovingBg.value"
        :is-mosaic-mode="effects.isMosaicBrushMode.value"
        @update-prop="handleUpdateProp"
        @delete="objects.deleteActive"
        @group="objects.groupObjects"
        @ungroup="objects.ungroupObjects"
        @remove-bg="effects.handleRemoveBg"
        @update-text-texture="effects.handleTextTexture"
        @update-clip="effects.handleClipImage"
        @set-as-bg="effects.handleSetBackground"
        @change-layer="objects.changeLayer"
        @toggle-style="objects.toggleStyle"
        @update-image-radius="effects.handleImageRadius"
        @align="objects.alignObject"
        @update-filter="effects.handleImageFilter"
        @update-text-curve="objects.handleTextCurve"
        @update-shadow="objects.handleSetShadow"
        @update-shadow-prop="objects.handleUpdateShadowProp"
        @distribute="objects.distributeObjects"
        @toggle-mosaic="effects.toggleMosaicBrush"
        @set-mosaic-width="effects.setMosaicWidth" />

      <ContextMenu
        :visible="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :selection-type="activeObject?.type"
        :has-selection="!!activeObject"
        :is-group="activeObject?.type === 'group'"
        @close="contextMenu.visible = false"
        @action="handleMenuAction" />

      <ExportDialog :visible="showExport" @close="showExport = false" @confirm="handleExportConfirm" />

      <!-- 剪裁操作条 -->
      <div
        v-if="tools.isCropping.value"
        class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-white px-6 py-3 rounded-full shadow-2xl z-[9999] border border-gray-100 animate-bounce-in">
        <span class="text-sm font-bold text-gray-500 flex items-center mr-2 border-r pr-4"> ✂️ 裁剪模式 </span>
        <button
          @click="tools.cancelCrop"
          class="px-4 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 text-sm font-medium transition text-gray-700">
          取消 (Esc)
        </button>
        <button
          @click="tools.confirmCrop"
          class="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-md">
          确认裁剪 (Enter)
        </button>
      </div>
    </div>
  </div>
</template>
