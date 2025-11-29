/*
 * @Description: 图片特效、滤镜、剪裁与背景处理逻辑
 */
import { ref, triggerRef, toRaw } from 'vue'
import { toast } from 'vue-sonner'
import { removeBackground } from '@imgly/background-removal'
import { FabricImage, filters, PencilBrush } from 'fabric'
// 🟢 [新增] MediaPipe 依赖
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'

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
  // 2. 智能抠图 (MediaPipe 平滑版 + 修复缩放问题)
  // =================================================================

  let imageSegmenter: ImageSegmenter | null = null

  const initMediaPipe = async () => {
    if (imageSegmenter) return
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          // 使用标准 Selfie 模型 (最稳定)
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
          delegate: 'GPU'
        },
        runningMode: 'IMAGE',
        // 🟢 关键修改：开启置信度输出，关闭类别输出
        // 这样拿到的数据是 0.0-1.0 的小数，而不是 0/1 整数
        outputCategoryMask: false,
        outputConfidenceMasks: true
      })
    } catch (error) {
      console.error('MediaPipe 初始化失败:', error)
      throw new Error('AI 模型加载失败')
    }
  }

  const handleRemoveBg = async () => {
    const active = toRaw(canvas.value?.getActiveObject())
    if (!active || (active.type !== 'image' && active.type !== 'fabric-image')) return

    try {
      isRemovingBg.value = true
      toast.info('正在执行 AI 抠图...')

      if (!imageSegmenter) await initMediaPipe()

      // 1. 记录当前视觉大小 (修复"图片缩小"问题)
      // 因为 setSrc 会重置 scale，我们需要手动恢复
      const prevWidth = active.getScaledWidth()
      const prevHeight = active.getScaledHeight()

      // 2. 转为图片元素
      const dataURL = active.toDataURL({ format: 'png', multiplier: 1 })
      const imgElement = document.createElement('img')
      imgElement.src = dataURL
      await new Promise(resolve => (imgElement.onload = resolve))

      // 3. 推理
      if (!imageSegmenter) throw new Error('Segmenter not ready')
      const result = imageSegmenter.segment(imgElement)

      // 🟢 获取置信度遮罩 (Float32Array)
      // 索引 0 通常是背景，索引 1 是人像 (对于 Selfie Segmenter 只有两个通道)
      // 如果是 Multiclass，索引会更多
      const masks = result.confidenceMasks
      if (!masks || masks.length === 0) throw new Error('No masks generated')

      // 我们取通道 1 (人像概率)。如果只有 1 个通道，那就取 0 并反转
      const personMask = masks.length > 1 ? masks[1] : masks[0]
      const maskData = personMask.getAsFloat32Array()

      // 4. 像素处理 (高级优化版)
      const width = imgElement.width
      const height = imgElement.height

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const ctx = tempCanvas.getContext('2d')!

      // 画原图
      ctx.drawImage(imgElement, 0, 0)
      const imgData = ctx.getImageData(0, 0, width, height)

      for (let i = 0; i < maskData.length; ++i) {
        let confidence = maskData[i] // 0.0 ~ 1.0

        // 🟢 优化 1: 边缘收缩 (Erode)
        // 原始模型往往会多扣一点背景。我们把判定阈值提高。
        // 只有 > 0.4 概率是人的，才保留。低于 0.4 的直接扔掉。
        // 这能去掉边缘那一圈淡淡的背景色。
        if (confidence < 0.4) {
          confidence = 0
        } else {
          // 将 0.4 ~ 1.0 的区间映射回 0.0 ~ 1.0
          // 否则边缘会很硬
          confidence = (confidence - 0.4) / (1.0 - 0.4)
        }

        // 🟢 优化 2: Gamma 校正 (使实心部分更实，边缘过渡更快)
        // 类似于 Photoshop 的“对比度增加”
        // 使用幂函数曲线
        confidence = Math.pow(confidence, 0.5) // 可以调参，0.5~0.8 比较好

        // 🟢 优化 3: 限制最大透明度
        // 防止人像中间出现半透明的洞
        if (confidence > 0.8) confidence = 1.0

        let alpha = confidence * 255

        // 如果你需要反转（针对背景/人反了的情况），取消下面注释
        // alpha = 255 - alpha

        imgData.data[i * 4 + 3] = alpha
      }

      ctx.putImageData(imgData, 0, 0)
      const newSrc = tempCanvas.toDataURL('image/png')

      // 5. 替换图片并恢复大小
      const refresh = () => {
        // 🟢 修复"图片缩小": 强制恢复之前的视觉宽度
        active.scaleToWidth(prevWidth)
        // (高度会自动按比例调整，或者你也用 scaleToHeight)

        active.set('dirty', true)
        active.setCoords()
        canvas.value.requestRenderAll()
        isRemovingBg.value = false
        toast.success('抠图完成')
        saveHistory()
        triggerRef(activeObject)
      }

      if (active.setSrc.length > 1) {
        active.setSrc(newSrc, refresh)
      } else {
        await active.setSrc(newSrc)
        refresh()
      }
    } catch (e) {
      isRemovingBg.value = false
      console.error(e)
      toast.error('抠图失败，可能图片中未检测到人像')
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

  // ==========================================================
  // 2. 马赛克画笔功能 (修复版)
  // ==========================================================
  const isMosaicBrushMode = ref(false)
  const brushSize = ref(30)

  // 备份之前的画笔状态
  let previousBrush: any = null
  let previousIsDrawing = false
  // 🟢 新增：用于暂存本次涂抹产生的所有碎片
  let currentMosaicBatch: any[] = []
  /**
   * 开启/关闭马赛克涂抹模式
   */
  const toggleMosaicBrush = (enable: boolean) => {
    if (!canvas.value) return

    if (enable) {
      isMosaicBrushMode.value = true
      currentMosaicBatch = [] // 🟢 清空批次记录
      // 1. 备份当前状态
      previousIsDrawing = canvas.value.isDrawingMode
      previousBrush = canvas.value.freeDrawingBrush

      // 2. 开启绘图模式
      canvas.value.isDrawingMode = true
      canvas.value.discardActiveObject()
      canvas.value.requestRenderAll()

      // 3. 设置为半透明红色的笔 (作为用户的视觉引导)
      // 🟢 使用直接引入的 PencilBrush
      const brush = new PencilBrush(canvas.value)
      brush.width = brushSize.value
      brush.color = 'rgba(255, 0, 0, 0.3)'
      brush.strokeLineCap = 'round'
      brush.strokeLineJoin = 'round'
      canvas.value.freeDrawingBrush = brush

      // 4. 监听路径生成事件 (画完一笔触发)
      canvas.value.on('path:created', handleMosaicPathCreated)

      toast.info('已开启马赛克涂抹')
    } else {
      // === 关闭模式 (执行成组逻辑) ===
      isMosaicBrushMode.value = false

      // 移除画笔监听
      canvas.value.off('path:created', handleMosaicPathCreated)

      // 🟢 [修复] Fabric v6 自动成组逻辑
      if (currentMosaicBatch.length > 0) {
        // 1. 过滤掉可能已经被用户手动删掉的对象
        // 确保对象还在画布上，避免报错
        const validObjects = currentMosaicBatch.filter(obj => canvas.value.contains(obj))

        if (validObjects.length > 0) {
          // 2. 【关键变动】先把零散的马赛克从画布上移除
          // 如果不移除，new Group 后画布上会有两份（一份在组里，一份在外面）
          canvas.value.remove(...validObjects)

          // 3. 【关键变动】直接使用 Group 构造函数
          // v6 写法：new Group(objectsArray, options)
          // 它会自动计算所有子对象的边界并将其包裹
          const GroupClass = fabric.value.Group // 获取 Group 类

          const group = new GroupClass(validObjects, {
            name: '马赛克涂层',
            // data: { isMosaicGroup: true }, // 如果你需要标记
            selectable: true,
            evented: true,
            subTargetCheck: true, // 允许双击进入组内编辑
            interactive: true // v6 新属性，确保交互性
          })

          // 4. 将组添加到画布
          canvas.value.add(group)

          // 5. 选中新生成的组
          canvas.value.setActiveObject(group)
          canvas.value.requestRenderAll()
          saveHistory()

          toast.success(`已合并 ${validObjects.length} 处马赛克`)
        }
      }

      // 清空暂存
      currentMosaicBatch = []

      // 恢复之前的画笔状态
      if (!previousIsDrawing) {
        canvas.value.isDrawingMode = false
      }
      if (previousBrush) {
        canvas.value.freeDrawingBrush = previousBrush
      }
      canvas.value.defaultCursor = 'default'
    }
  }

  /**
   * 动态调整笔触大小
   */
  const setMosaicWidth = (width: number) => {
    brushSize.value = width
    if (canvas.value && canvas.value.freeDrawingBrush && isMosaicBrushMode.value) {
      canvas.value.freeDrawingBrush.width = width
    }
  }

  /**
   * 核心逻辑：当用户画完一笔红线后，将其转换为马赛克贴片
   */
  const handleMosaicPathCreated = async (e: any) => {
    // 🟢 改为 async
    if (!isMosaicBrushMode.value) return

    const path = e.path
    if (!path) return

    // A. 移除刚才画的那条红线
    canvas.value.remove(path)

    // B. 计算红线的包围盒
    const rect = path.getBoundingRect()
    const padding = path.strokeWidth / 2
    const captureRect = {
      left: rect.left - padding,
      top: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    }

    // C. 截取包围盒区域
    const dataUrl = canvas.value.toDataURL({
      left: captureRect.left,
      top: captureRect.top,
      width: captureRect.width,
      height: captureRect.height,
      format: 'png',
      multiplier: 1
    })

    try {
      // D. 生成马赛克图片
      // 🟢 Fabric v6: fromURL 返回 Promise
      const img = await FabricImage.fromURL(dataUrl)

      const filter = new filters.Pixelate({
        blocksize: 8
      })
      img.filters.push(filter)
      img.applyFilters()

      // E. 定位图片中心
      const centerX = captureRect.left + captureRect.width / 2
      const centerY = captureRect.top + captureRect.height / 2

      img.set({
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true
      })

      // F. 设置 ClipPath
      // 🟢 Fabric v6: clone() 返回 Promise，不再用回调
      const clonedPath = await path.clone()

      const pathCenter = path.getCenterPoint()
      const dx = pathCenter.x - centerX
      const dy = pathCenter.y - centerY

      clonedPath.set({
        left: dx,
        top: dy,
        originX: 'center',
        originY: 'center',
        fill: null,
        stroke: 'black',
        strokeWidth: path.strokeWidth,
        strokeLineCap: path.strokeLineCap,
        strokeLineJoin: path.strokeLineJoin
      })

      // 应用蒙版
      img.clipPath = clonedPath

      // G. 添加到画布
      canvas.value.add(img)
      // 🟢 [新增] 将生成的马赛克图片加入暂存数组
      currentMosaicBatch.push(img)
      canvas.value.requestRenderAll()
    } catch (err) {
      console.error('马赛克生成失败:', err)
      toast.error('马赛克生成出错')
    }
  }
  // 强制退出马赛克模式
  const exitMosaicMode = () => {
    if (isMosaicBrushMode.value) {
      toggleMosaicBrush(false)
    }
  }
  return {
    isRemovingBg,
    handleUploadImage,
    handleRemoveBg, // 🟢 现在的默认抠图使用 MediaPipe
    handleImageFilter,
    handleClipImage,
    handleImageRadius,
    setBackgroundColor,
    handleSetBackground,
    handleTextTexture,
    isMosaicBrushMode,
    exitMosaicMode,
    toggleMosaicBrush,
    setMosaicWidth
  }
}
