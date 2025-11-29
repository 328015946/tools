import { ref, shallowRef, nextTick, onBeforeUnmount } from 'vue'
import { EDITOR_ASSETS } from '~/constants/assets'

export function useCanvasCore() {
  const canvas = shallowRef<any>(null)
  const fabric = shallowRef<any>(null)
  const isReady = ref(false)

  // 状态
  const canvasSize = ref({ width: 800, height: 1000 })
  const zoomLevel = ref(100)
  const workspaceSize = ref({ width: 0, height: 0 })
  const showGrid = ref(false)
  const activeObject = shallowRef<any>(null)

  // 历史记录
  const historyStack = ref<string[]>([])
  const historyIndex = ref(-1)
  let isHistoryProcessing = false

  // 资源
  const assets = EDITOR_ASSETS

  // --- 历史记录方法 ---
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

  // --- 视图与缩放 ---
  const autoFit = () => {
    if (!canvas.value || workspaceSize.value.width === 0) return
    const padding = 0
    const availableW = workspaceSize.value.width - padding
    const availableH = workspaceSize.value.height - padding
    const scaleX = availableW / canvasSize.value.width
    const scaleY = availableH / canvasSize.value.height
    let scale = Math.min(scaleX, scaleY)
    if (scale < 0.1) scale = 0.1
    scale = scale * 0.98
    zoomLevel.value = Math.floor(scale * 100)
  }

  const handleResize = ({ width, height }: { width: number; height: number }) => {
    if (!canvas.value) return
    canvasSize.value = { width, height }
    canvas.value.setDimensions({ width, height })

    // 背景图居中适配
    const bgImg = canvas.value.backgroundImage
    if (bgImg && bgImg instanceof fabric.value.Image) {
      bgImg.set({ left: width / 2, top: height / 2, originX: 'center', originY: 'center' })
    }

    canvas.value.requestRenderAll()
    saveHistory()
    nextTick(() => autoFit())
  }

  const handleZoom = (delta: number) => {
    let newZoom = zoomLevel.value + delta
    if (newZoom < 10) newZoom = 10
    if (newZoom > 500) newZoom = 500
    zoomLevel.value = newZoom
  }

  // --- 辅助功能 ---
  const updateActiveObject = () => {
    if (!canvas.value) return
    activeObject.value = canvas.value.getActiveObject()
  }

  const toggleGrid = () => {
    showGrid.value = !showGrid.value
  }

  // 销毁
  onBeforeUnmount(() => {
    if (canvas.value) {
      canvas.value.dispose()
      canvas.value = null
    }
  })

  return {
    canvas,
    fabric,
    isReady,
    canvasSize,
    zoomLevel,
    workspaceSize,
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
    toggleGrid
  }
}
