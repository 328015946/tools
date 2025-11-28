<!-- components/LayerItem.vue -->
<script setup lang="ts">
  import { computed, ref } from 'vue'

  const props = defineProps<{
    item: any
    depth: number
    activeId?: string
    index: number // 当前层级下的索引
  }>()

  const emit = defineEmits([
    'select',
    'toggle-visible',
    'toggle-lock',
    'toggle-expand',
    'drag-start',
    'drag-over',
    'drop-item'
  ])

  // 是否选中
  const isActive = computed(() => props.activeId === props.item.id)

  // 拖拽相关
  const handleDragStart = (e: DragEvent) => {
    e.stopPropagation()
    // 传递: ID, 原始索引, 父级ID(如果有)
    emit('drag-start', {
      id: props.item.id,
      item: props.item,
      depth: props.depth
    })
  }

  const handleDrop = (e: DragEvent) => {
    e.stopPropagation()
    emit('drop-item', { targetId: props.item.id, targetItem: props.item })
  }

  // 图标映射
  const getIcon = (type: string, name: string) => {
    if (name === '组合') return '📂'
    if (type === 'i-text' || type === 'text') return 'T'
    if (type === 'image') return '🖼️'
    if (type === 'rect') return '⬜'
    if (type === 'circle') return '⚪'
    return '💠'
  }
</script>

<template>
  <div class="layer-node select-none">
    <!-- 1. 自身内容行 -->
    <div
      class="flex items-center justify-between p-2 mb-1 rounded border border-transparent transition cursor-pointer group relative"
      :class="[
        isActive ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-white hover:bg-gray-50 border-gray-100'
      ]"
      :style="{ paddingLeft: depth * 16 + 8 + 'px' }"
      draggable="true"
      @click.stop="emit('select', item)"
      @dragstart="handleDragStart"
      @dragover.prevent="emit('drag-over', $event)"
      @drop="handleDrop">
      <!-- 左侧：折叠箭头 + 图标 + 名称 -->
      <div class="flex items-center gap-2 overflow-hidden">
        <!-- 折叠按钮 (仅 Group 显示) -->
        <button
          v-if="item.children && item.children.length > 0"
          @click.stop="emit('toggle-expand', item.id)"
          class="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 text-[10px] transition-transform"
          :class="{ 'rotate-90': item.collapsed }">
          ▶
        </button>
        <span v-else class="w-4"></span>

        <!-- 图标 -->
        <span class="text-sm opacity-70">{{ getIcon(item.type, item.name) }}</span>

        <!-- 名称 -->
        <span class="text-xs truncate font-medium text-gray-700 max-w-[100px]" :title="item.name">
          {{ item.name }}
        </span>
      </div>

      <!-- 右侧：显隐/锁定 (Hover显示或非默认状态显示) -->
      <div
        class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        :class="{ 'opacity-100': !item.visible || item.locked }">
        <!-- 显隐 -->
        <button @click.stop="emit('toggle-visible', item)" class="p-0.5 rounded hover:bg-gray-200 text-gray-500">
          <span v-if="item.visible" class="text-[10px]">👁️</span>
          <span v-else class="text-[10px] opacity-50">🚫</span>
        </button>
        <!-- 锁定 -->
        <button @click.stop="emit('toggle-lock', item)" class="p-0.5 rounded hover:bg-gray-200 text-gray-500">
          <span v-if="item.locked" class="text-[10px]">🔒</span>
          <span v-else class="text-[10px] opacity-50">🔓</span>
        </button>
      </div>
    </div>

    <!-- 2. 子级递归 (如果没折叠且有子元素) -->
    <div v-if="item.children && item.children.length > 0 && !item.collapsed">
      <LayerItem
        v-for="(child, idx) in item.children"
        :key="child.id"
        :item="child"
        :depth="depth + 1"
        :index="idx"
        :active-id="activeId"
        @select="emit('select', $event)"
        @toggle-visible="emit('toggle-visible', $event)"
        @toggle-lock="emit('toggle-lock', $event)"
        @toggle-expand="emit('toggle-expand', $event)"
        @drag-start="args => emit('drag-start', args)"
        @drag-over="e => emit('drag-over', e)"
        @drop-item="args => emit('drop-item', args)" />
    </div>
  </div>
</template>
