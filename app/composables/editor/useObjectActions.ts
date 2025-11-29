import { toRaw, triggerRef } from 'vue'
import { toast } from 'vue-sonner'

export function useObjectActions(
  canvas: any,
  fabric: any,
  activeObject: any,
  zoomLevel: any,
  saveHistory: Function,
  updateLayerList: Function
) {
  let _clipboard: any = null

  // =================================================================
  // 1. 内部辅助逻辑
  // =================================================================

  const createFabricObject = (item: any) => {
    const common = {
      left: item.left,
      top: item.top,
      fill: item.fill,
      stroke: item.stroke || null,
      strokeWidth: item.strokeWidth || 0,
      strokeDashArray: item.strokeDashArray || null,
      angle: item.angle || 0,
      originX: 'center',
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
      const path = new fabric.value.Path(item.path, { ...common, scaleX: 1, scaleY: 1 })
      if (item.width) path.scaleToWidth(item.width)
      return path
    }
    if (item.type === 'shape' && item.shape === 'star') {
      const starPath = 'M 0 -50 L 11 -15 L 47 -15 L 17 9 L 29 43 L 0 25 L -29 43 L -17 9 L -47 -15 L -11 -15 Z'
      const star = new fabric.value.Path(starPath, { ...common, scaleX: 1, scaleY: 1 })
      if (item.width) star.scaleToWidth(item.width)
      return star
    }

    return null
  }

  // =================================================================
  // 2. 基础增删改查 (CRUD)
  // =================================================================

  const addElement = (item: any, dropX?: number, dropY?: number) => {
    if (!canvas.value) return

    // 计算坐标
    let left, top
    if (dropX !== undefined && dropY !== undefined) {
      const rect = canvas.value.upperCanvasEl.getBoundingClientRect()
      const scale = zoomLevel.value / 100
      left = (dropX - rect.left) / scale
      top = (dropY - rect.top) / scale
    } else {
      left = canvas.value.width / 2
      top = canvas.value.height / 2
    }
    const commonProps = { left, top, originX: 'center', originY: 'center' }

    // --- 类型分发 ---
    if (item.type === 'component') {
      const objects: any[] = []
      item.children.forEach((child: any) => {
        const obj = createFabricObject(child)
        if (obj) objects.push(obj)
      })
      const group = new fabric.value.Group(objects, {
        ...commonProps,
        name: item.label,
        subTargetCheck: true
      })
      canvas.value.add(group)
      canvas.value.setActiveObject(group)
      saveHistory()
    } else if (item.type === 'text') {
      const text = new fabric.value.IText(item.content, {
        ...commonProps,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight,
        fontFamily: 'Arial',
        fill: '#333333',
        charSpacing: 0,
        lineHeight: 1.16
      })
      canvas.value.add(text)
      canvas.value.setActiveObject(text)
      saveHistory()
    } else if (item.type === 'svg') {
      // SVG 逻辑
      fetch(item.url)
        .then(res => (res.ok ? res.text() : Promise.reject('Network Error')))
        .then(svgStr => {
          const addToCanvas = (objects: any, options: any) => {
            if (!objects || !objects.length) return
            const validObjects = objects.filter((o: any) => o)
            let svgGroup
            if (fabric.value.util.groupSVGElements) {
              svgGroup = fabric.value.util.groupSVGElements(validObjects, options)
            } else {
              svgGroup = new fabric.value.Group(validObjects, { ...options })
            }
            svgGroup.set({ ...commonProps, fill: '#000000' })
            svgGroup.scaleToWidth(100)
            canvas.value.add(svgGroup)
            canvas.value.setActiveObject(svgGroup)
            canvas.value.requestRenderAll()
            saveHistory()
            updateLayerList()
          }
          const result = fabric.value.loadSVGFromString(svgStr)
          if (result && typeof result.then === 'function') {
            result.then((res: any) => addToCanvas(Array.isArray(res) ? res : res.objects, res.options || {}))
          } else {
            fabric.value.loadSVGFromString(svgStr, (objects: any, options: any) => addToCanvas(objects, options))
          }
        })
        .catch(err => toast.error('图标加载失败'))
    } else if (item.type === 'shape') {
      let shape
      const opts = { ...commonProps, fill: item.color, width: 100, height: 100 }
      if (item.shape === 'rect') shape = new fabric.value.Rect(opts)
      else if (item.shape === 'circle') shape = new fabric.value.Circle({ ...opts, radius: 50 })
      else if (item.shape === 'triangle') shape = new fabric.value.Triangle(opts)
      else if (item.shape === 'star') {
        const starPath = 'M 0 -50 L 11 -15 L 47 -15 L 17 9 L 29 43 L 0 25 L -29 43 L -17 9 L -47 -15 L -11 -15 Z'
        shape = new fabric.value.Path(starPath, { ...opts, scaleX: 1, scaleY: 1 })
        shape.scaleToWidth(100)
      }
      if (shape) {
        canvas.value.add(shape)
        canvas.value.setActiveObject(shape)
        saveHistory()
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
      saveHistory()
    } else if (item.type === 'image') {
      fabric.value.FabricImage.fromURL(item.url, { crossOrigin: 'anonymous' })
        .then((img: any) => {
          if (!img) return
          img.set({ ...commonProps })
          if (img.width > 300) img.scaleToWidth(300)
          canvas.value.add(img)
          canvas.value.setActiveObject(img)
          saveHistory()
        })
        .catch((err: any) => console.error(err))
    }
    updateLayerList()
  }

  const deleteActive = () => {
    const rawCanvas = toRaw(canvas.value)
    const active = rawCanvas?.getActiveObject()
    if (!active) return

    if (active.type === 'activeselection') {
      active.getObjects().forEach((o: any) => rawCanvas.remove(o))
      rawCanvas.discardActiveObject()
    } else if (active.data?.isProxy) {
      const original = toRaw(active.data.originalRef)
      const group = toRaw(active.data.groupRef)
      if (group) group.remove(original)
      rawCanvas.remove(active)
    } else {
      if (active.group) {
        const group = active.group
        group.remove(active)
        if (group.getObjects().length === 0) rawCanvas.remove(group)
      } else {
        rawCanvas.remove(active)
      }
    }
    rawCanvas.requestRenderAll()
    activeObject.value = null
    updateLayerList()
    saveHistory()
  }

  const updateProp = ({ key, value }: { key: string; value: any }) => {
    const active = canvas.value?.getActiveObject()
    if (!active) return
    if ((active.type === 'group' || active.type === 'path-group') && (key === 'fill' || key === 'stroke')) {
      active.getObjects().forEach((o: any) => o.set(key, value))
    }
    active.set(key, value)
    if (['fontSize', 'scaleX', 'scaleY'].includes(key)) active.setCoords()
    canvas.value.requestRenderAll()
    triggerRef(activeObject)
    saveHistory()
  }

  // =================================================================
  // 3. 组合与层级 (Grouping & Layering)
  // =================================================================

  const groupObjects = () => {
    const active = canvas.value.getActiveObject()
    if (!active || active.type !== 'activeselection') return
    const objects = active.getObjects().map((o: any) => toRaw(o))
    active.removeAll()
    canvas.value.remove(...objects)
    canvas.value.discardActiveObject()
    const group = new fabric.value.Group(objects, {
      canvas: canvas.value,
      subTargetCheck: true,
      name: '组合'
    })
    canvas.value.add(group)
    canvas.value.setActiveObject(group)
    canvas.value.requestRenderAll()
    updateLayerList()
    saveHistory()
    toast.success('已组合')
  }

  const ungroupObjects = () => {
    const active = canvas.value.getActiveObject()
    if (!active || active.type !== 'group') return
    const objects = active.getObjects()
    active.removeAll()
    canvas.value.remove(active)
    canvas.value.add(...objects)
    const sel = new fabric.value.ActiveSelection(objects, { canvas: canvas.value })
    canvas.value.setActiveObject(sel)
    canvas.value.requestRenderAll()
    updateLayerList()
    saveHistory()
    toast.success('已解组')
  }

  const changeLayer = (action: string) => {
    const active = canvas.value?.getActiveObject()
    if (!active) return
    if (action === 'up') canvas.value.bringObjectForward(active)
    if (action === 'down') canvas.value.sendObjectBackwards(active)
    if (action === 'top') canvas.value.bringObjectToFront(active)
    if (action === 'bottom') canvas.value.sendObjectToBack(active)
    canvas.value.requestRenderAll()
    updateLayerList()
    saveHistory()
  }

  // =================================================================
  // 4. 对齐与分布 (Alignment & Distribution)
  // =================================================================

  const alignObject = (action: string) => {
    const rawCanvas = toRaw(canvas.value)
    if (!rawCanvas) return
    const active = rawCanvas.getActiveObject()
    if (!active) return

    const canvasWidth = rawCanvas.width
    const canvasHeight = rawCanvas.height
    const isMultiSelection = active.type === 'activeselection'

    if (isMultiSelection) {
      // 多选：相对于选区边界对齐
      const groupWidth = active.width
      const groupHeight = active.height
      active.getObjects().forEach((obj: any) => {
        const objWidth = obj.getScaledWidth()
        const objHeight = obj.getScaledHeight()
        switch (action) {
          case 'left':
            obj.set('left', -groupWidth / 2 + objWidth / 2)
            break
          case 'right':
            obj.set('left', groupWidth / 2 - objWidth / 2)
            break
          case 'centerH':
            obj.set('left', 0)
            break
          case 'top':
            obj.set('top', -groupHeight / 2 + objHeight / 2)
            break
          case 'bottom':
            obj.set('top', groupHeight / 2 - objHeight / 2)
            break
          case 'centerV':
            obj.set('top', 0)
            break
        }
      })
    } else {
      // 单选：相对于画布对齐
      const bound = active.getBoundingRect(true)
      switch (action) {
        case 'centerH':
          rawCanvas.centerObjectH(active)
          break
        case 'centerV':
          rawCanvas.centerObjectV(active)
          break
        case 'left':
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
    active.setCoords()
    rawCanvas.requestRenderAll()
    saveHistory()
  }

  const distributeObjects = (direction: 'horizontal' | 'vertical') => {
    const active = canvas.value?.getActiveObject()
    if (!active || active.type !== 'activeselection') {
      toast.error('请先框选多个元素')
      return
    }
    const objects = active.getObjects()
    if (objects.length < 3) {
      toast.error('至少需要选 3 个元素才能均分')
      return
    }

    if (direction === 'horizontal') {
      objects.sort((a: any, b: any) => a.left - b.left)
      const first = objects[0]
      const last = objects[objects.length - 1]
      const totalDist = last.left - first.left
      const step = totalDist / (objects.length - 1)
      objects.forEach((obj: any, index: number) => {
        if (index === 0 || index === objects.length - 1) return
        obj.set('left', first.left + index * step)
      })
    } else {
      objects.sort((a: any, b: any) => a.top - b.top)
      const first = objects[0]
      const last = objects[objects.length - 1]
      const totalDist = last.top - first.top
      const step = totalDist / (objects.length - 1)
      objects.forEach((obj: any, index: number) => {
        if (index === 0 || index === objects.length - 1) return
        obj.set('top', first.top + index * step)
      })
    }
    active.setCoords()
    canvas.value.requestRenderAll()
    saveHistory()
    toast.success('已自动均分排列')
  }

  // =================================================================
  // 5. 复制粘贴 (Copy & Paste)
  // =================================================================

  const copy = () => {
    const active = canvas.value.getActiveObject()
    if (active) {
      active.clone().then((c: any) => {
        _clipboard = c
      })
    }
  }

  const paste = () => {
    if (!_clipboard) return
    _clipboard.clone().then((c: any) => {
      canvas.value.discardActiveObject()
      c.set({
        left: c.left + 20,
        top: c.top + 20,
        evented: true
      })
      if (c.type === 'activeSelection') {
        c.canvas = canvas.value
        c.forEachObject((o: any) => canvas.value.add(o))
      } else {
        canvas.value.add(c)
      }
      canvas.value.setActiveObject(c)
      canvas.value.requestRenderAll()
      saveHistory()
      updateLayerList()
    })
  }

  // =================================================================
  // 6. 样式与特效 (Style & Effects)
  // =================================================================

  // 设置阴影
  const handleSetShadow = (shadowConfig: any) => {
    const active = canvas.value?.getActiveObject()
    if (!active) return

    if (!shadowConfig) {
      active.set('shadow', null)
    } else {
      active.set('shadow', new fabric.value.Shadow(shadowConfig))
    }
    canvas.value.requestRenderAll()
    triggerRef(activeObject)
    saveHistory()
  }

  // 更新阴影属性
  const handleUpdateShadowProp = ({ key, value }: { key: string; value: any }) => {
    const active = canvas.value?.getActiveObject()
    if (!active || !active.shadow) return
    active.shadow[key] = value
    active.dirty = true
    canvas.value.requestRenderAll()
    triggerRef(activeObject)
    saveHistory()
  }

  // 切换字体样式
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
    triggerRef(activeObject)
    saveHistory()
  }

  // 文字弯曲
  const handleTextCurve = (value: number) => {
    const active = canvas.value?.getActiveObject()
    if (!active || !['i-text', 'text', 'textbox'].includes(active.type)) return

    // 归零
    if (Math.abs(value) < 2) {
      active.set('path', null)
      if (active.data) active.data.curveVal = 0
      canvas.value.requestRenderAll()
      saveHistory()
      return
    }
    if (!active.data) active.data = {}
    active.data.curveVal = value

    // 简单贝塞尔曲线计算
    const width = active.getScaledWidth()
    const controlY = value * 2
    const pathW = width
    const pathData = `M 0 0 Q ${pathW / 2} ${controlY} ${pathW} 0`

    const path = new fabric.value.Path(pathData, {
      visible: false,
      noScaleCache: true
    })

    active.set({ path: path })
    canvas.value.requestRenderAll()
    // 节流 saveHistory 可选
  }

  // =================================================================
  // 7. 辅助工具 (Guides)
  // =================================================================

  const createGuideLine = (direction: 'h' | 'v', position: number) => {
    if (!canvas.value) return
    const limit = 5000
    let points: any = []
    let props = {}
    if (direction === 'h') {
      points = [-limit, position, limit, position]
      props = { lockMovementX: true, lockMovementY: false, cursor: 'ns-resize' }
    } else {
      points = [position, -limit, position, limit]
      props = { lockMovementX: false, lockMovementY: true, cursor: 'ew-resize' }
    }
    const line = new fabric.value.Line(points, {
      ...props,
      stroke: '#06b6d4',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: true,
      evented: true,
      excludeFromExport: true,
      data: { isGuide: true },
      perPixelTargetFind: true
    })
    canvas.value.add(line)
    canvas.value.setActiveObject(line)
    canvas.value.requestRenderAll()
    saveHistory()
  }

  const addGuide = (direction: 'h' | 'v') => {
    if (!canvas.value) return
    const center = canvas.value.getVpCenter()
    const pos = direction === 'h' ? center.y : center.x
    createGuideLine(direction, pos)
  }
  // [新增] 样式剪贴板
  let _styleClipboard: any = null
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

  return {
    addElement,
    deleteActive,
    groupObjects,
    ungroupObjects,
    changeLayer,
    alignObject,
    distributeObjects,
    updateProp,
    handleSetShadow,
    handleUpdateShadowProp,
    toggleStyle,
    handleTextCurve,
    copy,
    paste,
    copyStyle,
    pasteStyle,
    createGuideLine,
    addGuide
  }
}
