<template>
  <div class="relative inline-block" :style="{ width: width }">
    <!-- SVG 气泡背景 -->
    <svg class="w-full h-auto block drop-shadow-sm" :viewBox="dynamicViewBox" xmlns="http://www.w3.org/2000/svg">
      <path :d="bubblePath" :fill="bgColor" />
    </svg>

    <!-- 内容区域（绝对定位） -->
    <div class="absolute w-full px-4" :style="contentBoxStyle">
      <!-- 内容容器：高度固定，内部可选择居中 -->
      <div class="relative w-full h-full">
        <!-- 内容多时：滚动层 -->
        <div ref="scrollLayer" class="absolute inset-0 overflow-y-auto custom-scrollbar" v-if="isOverflowing">
          <p class="text-sm text-center break-words leading-snug" :style="{ color: textColor }">
            {{ text }}
          </p>
        </div>

        <!-- 内容少时：垂直居中 -->
        <div v-else class="absolute inset-0 flex items-center justify-center">
          <p class="text-sm text-center break-words leading-snug" :style="{ color: textColor }">
            {{ text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, nextTick } from 'vue'

  const props = defineProps({
    width: { type: String, default: '200px' },
    text: { type: String, default: '' },
    bgColor: { type: String, default: '#3B82F6' },
    textColor: { type: String, default: '#FFFFFF' },
    tailPos: { type: [String, Number], default: 'center' },
    radius: { type: Number, default: 10 },
    tailHeight: { type: Number, default: 10 },
    tailWidth: { type: Number, default: 20 }
  })

  /* SVG 绝对坐标尺寸 */
  const BODY_H = 60
  const BODY_W = 100
  const P = 5

  /* ViewBox */
  const dynamicViewBox = computed(() => {
    const totalH = BODY_H + props.tailHeight
    return `-${P} -${P} ${BODY_W + P * 2} ${totalH + P * 2}`
  })

  /* 气泡路径 */
  const bubblePath = computed(() => {
    const r = props.radius
    const tH = props.tailHeight
    const tW = props.tailWidth
    const halfTW = tW / 2

    let tipX = 50
    const minSafe = r + halfTW
    const maxSafe = BODY_W - r - halfTW

    if (props.tailPos === 'left') tipX = 20
    else if (props.tailPos === 'right') tipX = 80
    else if (typeof props.tailPos === 'number') tipX = props.tailPos

    tipX = Math.max(minSafe, Math.min(maxSafe, tipX))

    return `
    M 0 ${r}
    A ${r} ${r} 0 0 1 ${r} 0
    H ${BODY_W - r}
    A ${r} ${r} 0 0 1 ${BODY_W} ${r}
    V ${BODY_H - r}
    A ${r} ${r} 0 0 1 ${BODY_W - r} ${BODY_H}
    H ${tipX + halfTW}
    L ${tipX} ${BODY_H + tH}
    L ${tipX - halfTW} ${BODY_H}
    H ${r}
    A ${r} ${r} 0 0 1 0 ${BODY_H - r}
    Z`
  })

  /* 内容区域 - 精准定位到主体矩形内部 */
  const contentBoxStyle = computed(() => {
    const safePad = 8 // 避开圆角
    const textH = BODY_H - safePad * 2
    const startY = P + safePad
    const totalH = BODY_H + props.tailHeight + P * 2

    return {
      top: `${(startY / totalH) * 100}%`,
      height: `${(textH / totalH) * 100}%`
    }
  })

  /* 自动判断内容是否溢出（决定居中 or 滚动） */
  const scrollLayer = ref<HTMLElement | null>(null)
  const isOverflowing = ref(false)

  onMounted(async () => {
    await nextTick()
    const el = scrollLayer.value
    if (!el) return

    // 检查是否超出
    isOverflowing.value = el.scrollHeight > el.clientHeight
  })
</script>

<style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.4);
    border-radius: 3px;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.4) transparent;
  }
</style>
