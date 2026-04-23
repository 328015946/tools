import { ref, markRaw, toRaw } from 'vue'

export function useLayerSystem(canvas: any, fabric: any, activeObject: any, saveHistory: Function) {
  const layers = ref<any[]>([])
  const collapsedGroups = ref<Set<string>>(new Set())
  const workspaceRef = ref<any>(null) // 需要在外部绑定

  // --- 图层列表更新 ---
  const updateLayerList = () => {
    if (!canvas.value) return
    const mapObjectToLayer = (obj: any): any => {
      if (obj.name?.startsWith('Proxy-') || obj.excludeFromExport || obj.data?.isGuide) return null

      if (!obj.id) obj.id = Math.random().toString(36).substr(2, 9)

      let name = obj.name || '元素'
      if (!obj.name) {
        const type = obj.type
        if (['i-text', 'text', 'textbox'].includes(type)) name = obj.text?.slice(0, 8) || '文字'
        else if (type === 'image') name = '图片'
        else if (type === 'group') name = '组合'
        else if (type === 'rect') name = '矩形'
        else if (type === 'circle') name = '圆形'
        else if (type === 'path') name = '形状'
      }

      const node: any = {
        id: obj.id,
        type: obj.type,
        name: name,
        visible: obj.visible,
        locked: !!obj.lockMovementX,
        collapsed: collapsedGroups.value.has(obj.id),
        objectRef: markRaw(obj),
        children: []
      }

      if (obj.type === 'group' && obj.getObjects) {
        node.children = [...obj.getObjects()]
          .reverse()
          .map(mapObjectToLayer)
          .filter((i: any) => i !== null)
      }
      return node
    }

    layers.value = [...canvas.value.getObjects()]
      .reverse()
      .map(mapObjectToLayer)
      .filter((i: any) => i !== null)
  }

  // --- 核心：Proxy 替身模式 ---
  const applyProxyChangesToOriginal = (group: any, original: any, proxy: any) => {
    const groupMatrix = group.calcTransformMatrix()
    const inverted = fabric.value.util.invertTransform(groupMatrix)
    const proxyMatrix = proxy.calcTransformMatrix()
    const relative = fabric.value.util.multiplyTransformMatrices(inverted, proxyMatrix)
    const opt = fabric.value.util.qrDecompose(relative)

    original.set({
      angle: opt.angle,
      scaleX: opt.scaleX,
      scaleY: opt.scaleY,
      skewX: opt.skewX,
      skewY: opt.skewY,
      left: opt.translateX,
      top: opt.translateY,
      originX: 'center',
      originY: 'center',
      flipX: proxy.flipX,
      flipY: proxy.flipY
    })
    original.setCoords()
  }

  const activateProxyMode = (obj: any, parentGroup: any, autoEdit = false) => {
    if (obj._isProxyMode) return
    obj.clone().then((proxy: any) => {
      if (!proxy) return
      const matrix = obj.calcTransformMatrix()
      const options = fabric.value.util.qrDecompose(matrix)

      proxy.set({
        ...options,
        left: options.translateX,
        top: options.translateY,
        hasControls: true,
        lockMovementX: false,
        lockMovementY: false,
        name: `Proxy-${obj.name}`,
        excludeFromExport: true,
        borderColor: '#4f46e5',
        borderDashArray: [4, 4],
        data: { isProxy: true, originalRef: obj, groupRef: parentGroup }
      })

      obj.visible = false
      obj._isProxyMode = true
      parentGroup.dirty = true
      canvas.value.add(proxy)
      canvas.value.setActiveObject(proxy)

      if (autoEdit && ['i-text', 'text', 'textbox'].includes(proxy.type)) {
        setTimeout(() => {
          proxy.enterEditing()
          proxy.selectAll()
          canvas.value.requestRenderAll()
        }, 50)
      }

      const sync = () => {
        applyProxyChangesToOriginal(parentGroup, obj, proxy)
        if (proxy.text !== undefined) obj.set('text', proxy.text)
        parentGroup.dirty = true
      }

      proxy.on('moving', sync)
      proxy.on('scaling', sync)
      proxy.on('rotating', sync)
      proxy.on('changed', sync)
      proxy.on('modified', saveHistory)

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

  const exitAllProxyModes = () => {
    if (!canvas.value) return
    const proxies = canvas.value.getObjects().filter((o: any) => o.data && o.data.isProxy)
    proxies.forEach((proxy: any) => {
      const original = proxy.data.originalRef
      if (original) original.visible = true
      canvas.value.remove(proxy)
    })
    canvas.value.requestRenderAll()
  }

  // --- 图层操作 ---
  const selectLayer = (layerItem: any) => {
    const obj = toRaw(layerItem.objectRef)
    if (!canvas.value || !obj || !obj.visible) return

    // 视图定位
    const bound = obj.getBoundingRect()
    if (workspaceRef.value) {
      workspaceRef.value.panToCenter(
        bound.left + bound.width / 2,
        bound.top + bound.height / 2,
        canvas.value.width,
        canvas.value.height
      )
    }

    if (obj.group) {
      activateProxyMode(obj, obj.group, false)
    } else {
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

  const toggleLayerLock = (layerItem: any) => {
    const obj = layerItem.objectRef
    const isLocked = !layerItem.locked
    const props = ['lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY']
    props.forEach(p => (obj[p] = isLocked))
    canvas.value.requestRenderAll()
    updateLayerList()
    saveHistory()
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

  const handleLayerReorder = ({ dragId, targetId, position }: any) => {
    if (!canvas.value || dragId === targetId) return
    const objects = canvas.value.getObjects()
    const dragObj = objects.find((o: any) => o.id === dragId)
    const targetObj = objects.find((o: any) => o.id === targetId)
    if (!dragObj || !targetObj) return

    if (position === 'top') {
      dragObj.bringToFront()
      while (canvas.value.getObjects().indexOf(dragObj) > canvas.value.getObjects().indexOf(targetObj) + 1) {
        canvas.value.sendBackwards(dragObj)
      }
    } else {
      dragObj.sendToBack()
      while (canvas.value.getObjects().indexOf(dragObj) < canvas.value.getObjects().indexOf(targetObj) - 1) {
        canvas.value.bringForward(dragObj)
      }
    }
    canvas.value.requestRenderAll()
    updateLayerList()
    saveHistory()
  }

  return {
    layers,
    collapsedGroups,
    workspaceRef,
    updateLayerList,
    activateProxyMode,
    exitAllProxyModes,
    selectLayer,
    toggleLayerVisible,
    toggleLayerLock,
    toggleGroupExpand,
    handleLayerReorder
  }
}
