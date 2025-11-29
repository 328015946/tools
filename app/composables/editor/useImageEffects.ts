/*
 * @Description: 图片特效、滤镜、剪裁与背景处理逻辑
 */
import { ref, triggerRef, toRaw } from 'vue'
import { toast } from 'vue-sonner'
import { removeBackground } from '@imgly/background-removal'

export function useImageEffects(canvas: any, fabric: any, activeObject: any, saveHistory: Function) {
  const isRemovingBg = ref(false)

  // =================================================================
  // 1. 资源上传
  // =================================================================

  const handleUploadImage = (file: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = f => {
      const data = f.target?.result as string
      fabric.value.FabricImage.fromURL(data).then((img: any) => {
        if (!img) return
        const vpCenter = canvas.value.getVpCenter()
        img.set({
          left: vpCenter.x,
          top: vpCenter.y,
          originX: 'center',
          originY: 'center'
        })
        // 限制初始大小
        if (img.width > canvas.value.width / 2) img.scaleToWidth(canvas.value.width / 2)

        canvas.value.add(img)
        canvas.value.setActiveObject(img)
        saveHistory()
      })
    }
    reader.readAsDataURL(file)
  }

  // =================================================================
  // 2. 智能抠图 (AI)
  // =================================================================

  const handleRemoveBg = async () => {
    const active = toRaw(canvas.value?.getActiveObject())
    if (!active || active.type !== 'image') return
    try {
      isRemovingBg.value = true
      toast.info('AI 正在智能抠图...')
      const blob = await removeBackground(active.getSrc())
      const newSrc = URL.createObjectURL(blob)

      const refresh = () => {
        active.set('dirty', true)
        active.set('objectCaching', false)
        active.setCoords()
        canvas.value.renderAll()
        setTimeout(() => active.set('objectCaching', true), 500)
        isRemovingBg.value = false
        toast.success('抠图完成')
        saveHistory()
        triggerRef(activeObject)
      }

      // 替换图片源
      const ret = active.setSrc(newSrc, refresh, { crossOrigin: 'anonymous' })
      // 兼容 Fabric 不同版本的 setSrc 返回
      if (ret && ret.then) await ret
      else refresh()
    } catch (e) {
      isRemovingBg.value = false
      toast.error('抠图失败，请重试')
      console.error(e)
    }
  }

  // =================================================================
  // 3. 滤镜系统 (Filters)
  // =================================================================

  const handleImageFilter = (payload: any) => {
    if (!canvas.value) return
    const active = canvas.value.getActiveObject()
    if (!active || active.type !== 'image') return

    // 兼容 Fabric v5/v6 命名空间
    const ns = fabric.value.Image?.filters || fabric.value.filters

    // A. 预设模式 (Grayscale, Sepia, Invert, RemoveColor...)
    if (payload.type !== 'parameter') {
      if (payload.type === 'none') {
        // 清空所有滤镜
        active.filters = []
      } else {
        // 移除同类型的旧滤镜，防止叠加
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
          // 可扩展其他简单滤镜
        }
      }
    }
    // B. 参数调节模式 (Brightness, Contrast, etc.)
    else {
      const { name, value } = payload
      // 查找当前是否已有该滤镜
      let filter = active.filters.find((f: any) => f.type === name)

      if (!filter) {
        // 创建新滤镜
        if (name === 'Brightness') filter = new ns.Brightness({ brightness: value })
        if (name === 'Contrast') filter = new ns.Contrast({ contrast: value })
        if (name === 'Saturation') filter = new ns.Saturation({ saturation: value })
        if (name === 'Blur') filter = new ns.Blur({ blur: value })
        if (filter) active.filters.push(filter)
      } else {
        // 更新属性
        if (name === 'Brightness') filter.brightness = value
        if (name === 'Contrast') filter.contrast = value
        if (name === 'Saturation') filter.saturation = value
        if (name === 'Blur') filter.blur = value
      }
    }

    active.applyFilters()
    canvas.value.requestRenderAll()
    triggerRef(activeObject) // 通知 UI 更新滑块状态
    // saveHistory() // 如果拖拽滑块卡顿，建议在松手时再保存，此处可选
  }

  // =================================================================
  // 4. 剪裁与形状 (Clipping & Radius)
  // =================================================================

  // 图片圆角 (通过 ClipPath 实现)
  const handleImageRadius = (radius: number) => {
    const active = canvas.value?.getActiveObject()
    if (!active || active.type !== 'image') return // 记录属性用于回显
    ;(active as any).corners = radius

    if (radius === 0) {
      active.set('clipPath', null)
    } else {
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
    triggerRef(activeObject)
    saveHistory()
  }

  // 形状剪裁 (Circle, Heart, Star...)
  const handleClipImage = (type: string) => {
    if (!canvas.value) return
    const active = canvas.value.getActiveObject()
    if (!active || active.type !== 'image') return

    // 还原
    if (type === 'none') {
      active.set({ clipPath: null, dirty: true })
      // 同时清空圆角记录
      ;(active as any).corners = 0
      canvas.value.requestRenderAll()
      saveHistory()
      triggerRef(activeObject)
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
      absolutePositioned: false, // 相对剪裁
      data: { clipName: type }
    }

    if (type === 'circle') {
      clipObj = new fabric.value.Circle({ ...common, radius: size })
    } else if (type === 'rounded') {
      // 默认给一个适中的圆角
      clipObj = new fabric.value.Rect({
        ...common,
        width: width,
        height: height,
        rx: size * 0.3,
        ry: size * 0.3
      })
    } else if (type === 'heart') {
      const heartSVG =
        'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
      clipObj = new fabric.value.Path(heartSVG, { ...common })
      // 适配大小
      const bounds = clipObj.getBoundingRect()
      const scale = (Math.min(width, height) / Math.max(bounds.width, bounds.height)) * 0.9
      clipObj.scale(scale)
      // 修正中心
      const center = clipObj.getCenterPoint()
      clipObj.left = -center.x
      clipObj.top = -center.y
    } else if (type === 'star') {
      // 五角星点位计算
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
      // 避免冲突
      ;(active as any).corners = 0
      canvas.value.requestRenderAll()
      saveHistory()
      triggerRef(activeObject)
    }
  }

  // =================================================================
  // 5. 背景设置
  // =================================================================

  const setBackgroundColor = (val: string | any) => {
    if (!canvas.value) return

    if (typeof val === 'string') {
      canvas.value.backgroundColor = val
    } else {
      // 渐变对象
      const g = new fabric.value.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: canvas.value.height },
        colorStops: [
          { offset: 0, color: val.start },
          { offset: 1, color: val.end }
        ]
      })
      canvas.value.backgroundColor = g
    }
    canvas.value.requestRenderAll()
    saveHistory()
  }

  const handleSetBackground = () => {
    const active = canvas.value?.getActiveObject()
    if (!active || active.type !== 'image') return

    active.clone().then((img: any) => {
      // 计算铺满画布的缩放比例 (Cover 模式)
      const canvasW = canvas.value.width
      const canvasH = canvas.value.height
      const scaleX = canvasW / img.width
      const scaleY = canvasH / img.height
      const scale = Math.max(scaleX, scaleY)

      img.set({
        originX: 'center',
        originY: 'center',
        left: canvasW / 2,
        top: canvasH / 2,
        scaleX: scale,
        scaleY: scale,
        clipPath: null // 背景图不需要剪裁
      })

      canvas.value.backgroundImage = img
      canvas.value.remove(active)
      canvas.value.requestRenderAll()
      saveHistory()
      toast.success('已设为背景')
    })
  }

  // =================================================================
  // 6. 文字特效 (纹理)
  // =================================================================

  const handleTextTexture = (file: File | null) => {
    const active = canvas.value?.getActiveObject()
    if (!active || !['i-text', 'text', 'textbox'].includes(active.type)) return

    if (!file) {
      active.set('fill', '#000000')
      canvas.value.requestRenderAll()
      saveHistory()
      return
    }

    const reader = new FileReader()
    reader.onload = f => {
      const img = new Image()
      img.src = f.target?.result as string
      img.onload = () => {
        const pattern = new fabric.value.Pattern({
          source: img,
          repeat: 'repeat'
        })
        active.set({ fill: pattern, dirty: true })
        canvas.value.requestRenderAll()
        saveHistory()
        triggerRef(activeObject)
      }
    }
    reader.readAsDataURL(file)
  }

  return {
    isRemovingBg,
    handleUploadImage,
    handleRemoveBg,
    handleImageFilter,
    handleClipImage,
    handleImageRadius,
    setBackgroundColor,
    handleSetBackground,
    handleTextTexture
  }
}
