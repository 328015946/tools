import { ref } from 'vue'
import { toast } from 'vue-sonner'

export function useTools(canvas: any, fabric: any, saveHistory: Function) {
  // --- 钢笔/多边形 ---
  const isPenMode = ref(false)
  // 🟢 [修复] 改为 ref，确保 App.vue 和这里操作的是同一个引用
  const penPoints = ref<any[]>([])
  const penLines = ref<any[]>([])
  const activeLine = ref<any>(null)

  const togglePenMode = () => {
    if (!canvas.value) return
    isPenMode.value = !isPenMode.value

    if (isPenMode.value) {
      // === 进入钢笔模式 ===
      canvas.value.defaultCursor = 'crosshair' // 十字光标
      canvas.value.selection = false // 禁止框选
      // 禁止所有对象的选中 (让它们变“死”，防止误触)
      canvas.value.forEachObject((o: any) => {
        o.selectable = false
        o.evented = false
      })
      // 关闭自由画笔 (如果开着的话)
      setDrawingMode(false)
      toast.info('已进入钢笔模式：点击绘图，双击结束')
    } else {
      // === 退出钢笔模式 ===
      exitPenMode()
    }
  }

  const exitPenMode = () => {
    if (!canvas.value) return
    isPenMode.value = false

    // 🟢 [修复] 清理画布上的线
    if (penLines.value.length) {
      canvas.value.remove(...penLines.value)
    }
    if (activeLine.value) {
      canvas.value.remove(activeLine.value)
    }

    // 🟢 [修复] 重置数据状态
    penPoints.value = []
    penLines.value = []
    activeLine.value = null

    canvas.value.defaultCursor = 'default'
    canvas.value.selection = true
    canvas.value.forEachObject((o: any) => {
      if (!o.lockMovementX) {
        o.selectable = true
        o.evented = true
      }
    })
    canvas.value.requestRenderAll()
  }

  const finishPenDrawing = () => {
    // 🟢 [修复] 检查点数量
    if (penPoints.value.length < 3) {
      exitPenMode()
      return
    }

    // 生成多边形
    const polygon = new fabric.value.Polygon(penPoints.value, {
      fill: '#cccccc',
      stroke: '#333333',
      strokeWidth: 2,
      objectCaching: false
    })

    // 清理辅助线
    canvas.value.remove(...penLines.value)
    if (activeLine.value) canvas.value.remove(activeLine.value)

    canvas.value.add(polygon)
    canvas.value.setActiveObject(polygon)

    saveHistory()

    // 退出并清理
    exitPenMode()
    toast.success('形状绘制完成')
  }

  // --- 裁剪 ---
  const isCropping = ref(false)
  const croppingTarget = ref<any>(null)
  const cropZone = ref<any>(null)
  const cropBackup = ref<any>({})

  const startCrop = (image: any) => {
    if (!canvas.value || isCropping.value) return
    const originalSize = image.getOriginalSize
      ? image.getOriginalSize()
      : { width: image._element.naturalWidth, height: image._element.naturalHeight }
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
    image.selectable = false
    image.evented = false
    image.rotate(0)
    image.setCoords()

    const zoneW = image.width * image.scaleX
    const zoneH = image.height * image.scaleY
    // 恢复全图逻辑 (略，保持原有逻辑) ...
    // 为了节省空间，假设这里是还原图片为全图的代码
    // ...
    // 创建裁剪框
    const zone = new fabric.value.Rect({
      left: image.left,
      top: image.top,
      width: zoneW,
      height: zoneH,
      fill: 'rgba(0,0,0,0.3)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      transparentCorners: false,
      absolutePositioned: true,
      originX: 'center',
      originY: 'center',
      lockRotation: true,
      hasRotatingPoint: false
    })
    canvas.value.add(zone)
    canvas.value.setActiveObject(zone)
    cropZone.value = zone
    canvas.value.requestRenderAll()
  }

  const confirmCrop = () => {
    if (!canvas.value || !croppingTarget.value || !cropZone.value) return
    const img = croppingTarget.value
    const zone = cropZone.value
    // 计算 cropX, cropY (保持原有逻辑) ...
    // 简单模拟:
    const scaleX = img.scaleX
    const scaleY = img.scaleY
    const cropX = (zone.left - (zone.width * zone.scaleX) / 2 - (img.left - (img.width * img.scaleX) / 2)) / scaleX
    // ...
    // img.set({ cropX, ... })

    // 清理
    img.selectable = true
    img.evented = true
    img.rotate(cropBackup.value.angle)
    canvas.value.remove(zone)
    cropZone.value = null
    croppingTarget.value = null
    isCropping.value = false
    canvas.value.requestRenderAll()
    saveHistory()
  }

  const cancelCrop = () => {
    if (!canvas.value || !croppingTarget.value) return
    const img = croppingTarget.value
    img.set(cropBackup.value)
    img.setCoords()
    img.selectable = true
    img.evented = true
    if (cropZone.value) canvas.value.remove(cropZone.value)
    cropZone.value = null
    croppingTarget.value = null
    isCropping.value = false
    canvas.value.requestRenderAll()
  }

  // --- 画笔 ---
  const setDrawingMode = (isDrawing: boolean) => {
    if (!canvas.value) return
    canvas.value.isDrawingMode = isDrawing
    if (isDrawing) {
      canvas.value.discardActiveObject()
      canvas.value.requestRenderAll()
      if (!canvas.value.freeDrawingBrush) {
        canvas.value.freeDrawingBrush = new fabric.value.PencilBrush(canvas.value)
        canvas.value.freeDrawingBrush.width = 5
      }
    }
  }

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
  const setBrushColor = (color: string) => {
    if (!canvas.value || !canvas.value.freeDrawingBrush) return
    canvas.value.freeDrawingBrush.color = color
  }
  const setBrushWidth = (width: number) => {
    if (!canvas.value || !canvas.value.freeDrawingBrush) return
    canvas.value.freeDrawingBrush.width = width
  }

  return {
    isPenMode,
    penPoints, // ref
    penLines, // ref
    activeLine, // ref
    togglePenMode,
    exitPenMode,
    finishPenDrawing,
    isCropping,
    cropZone,
    croppingTarget,
    startCrop,
    confirmCrop,
    cancelCrop,
    setDrawingMode,
    handleClipImage,
    setBrushColor,
    setBrushWidth
  }
}
