// composables/useSvgSnippets.ts
import { reactive } from 'vue'

export interface SnippetControl {
  type: 'select' | 'color' | 'number' | 'range' | 'boolean'
  key: string
  label: string
  options?: string[]
  min?: number
  max?: number
  step?: number
}

export interface SvgSnippet {
  id: string
  nameKey: string
  descKey: string
  category: 'Icon' | 'Pattern' | 'Loader' | 'Shape'
  params: Record<string, any>
  controls: SnippetControl[]
  // 返回 SVG 字符串
  getCode: (params: any) => string
}

export const useSvgSnippets = () => {
  const snippets = reactive<SvgSnippet[]>([
    // ================= ICONS (基础图标) =================
    {
      id: 'menu',
      nameKey: 'svg.items.menu.title',
      descKey: 'svg.items.menu.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#333333', round: true },
      controls: [
        { type: 'number', key: 'size', label: 'Size', min: 16, max: 128 },
        { type: 'number', key: 'stroke', label: 'Width', min: 1, max: 5, step: 0.5 },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'boolean', key: 'round', label: 'Round Cap' }
      ],
      getCode: p => {
        const cap = p.round ? 'stroke-linecap="round"' : ''
        return `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 6H20M4 12H20M4 18H20" stroke="${p.color}" stroke-width="${p.stroke}" ${cap} stroke-linejoin="round"/>
</svg>`
      }
    },
    {
      id: 'close',
      nameKey: 'svg.items.close.title',
      descKey: 'svg.items.close.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#ef4444', round: true },
      controls: [
        { type: 'number', key: 'size', label: 'Size', min: 16 },
        { type: 'number', key: 'stroke', label: 'Width', step: 0.5 },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'boolean', key: 'round', label: 'Round Cap' }
      ],
      getCode: p => {
        const cap = p.round ? 'stroke-linecap="round"' : ''
        return `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 18L18 6M6 6L18 18" stroke="${p.color}" stroke-width="${p.stroke}" ${cap} stroke-linejoin="round"/>
</svg>`
      }
    },
    {
      id: 'arrow',
      nameKey: 'svg.items.arrow.title',
      descKey: 'svg.items.arrow.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#333333', dir: 'right' },
      controls: [
        { type: 'select', key: 'dir', label: 'Dir', options: ['right', 'left', 'up', 'down'] },
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => {
        let rotation = 0
        if (p.dir === 'down') rotation = 90
        else if (p.dir === 'left') rotation = 180
        else if (p.dir === 'up') rotation = -90

        return `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${rotation}deg)">
  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
      }
    },

    // ================= PATTERNS (背景纹理) =================
    // 这是 SVG 最强大的地方，可以生成无限重复的背景
    {
      id: 'grid-pattern',
      nameKey: 'svg.items.grid.title',
      descKey: 'svg.items.grid.desc',
      category: 'Pattern',
      params: { size: 20, color: '#e5e7eb', stroke: 1 },
      controls: [
        { type: 'number', key: 'size', label: 'Gap (px)', min: 10, max: 100 },
        { type: 'number', key: 'stroke', label: 'Width', step: 0.5 },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="${p.size}" height="${p.size}" patternUnits="userSpaceOnUse">
      <path d="M ${p.size} 0 L 0 0 0 ${p.size}" fill="none" stroke="${p.color}" stroke-width="${p.stroke}"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />
</svg>`
    },
    {
      id: 'dot-pattern',
      nameKey: 'svg.items.dot.title',
      descKey: 'svg.items.dot.desc',
      category: 'Pattern',
      params: { size: 20, radius: 1, color: '#9ca3af' },
      controls: [
        { type: 'number', key: 'size', label: 'Gap', min: 10, max: 60 },
        { type: 'number', key: 'radius', label: 'Radius', min: 1, step: 0.5 },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dot" x="0" y="0" width="${p.size}" height="${p.size}" patternUnits="userSpaceOnUse">
      <circle cx="${p.radius}" cy="${p.radius}" r="${p.radius}" fill="${p.color}" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#dot)" />
</svg>`
    },

    // ================= LOADERS (动画) =================
    {
      id: 'spinner',
      nameKey: 'svg.items.spinner.title',
      descKey: 'svg.items.spinner.desc',
      category: 'Loader',
      params: { size: 40, color: '#3B82F6', duration: 1 },
      controls: [
        { type: 'number', key: 'size', label: 'Size', min: 20 },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'duration', label: 'Speed(s)', min: 0.2, max: 3, step: 0.1 }
      ],
      getCode: p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  <circle cx="25" cy="25" r="20" fill="none" stroke="${p.color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="80" stroke-dashoffset="20">
    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="${p.duration}s" repeatCount="indefinite" />
  </circle>
</svg>`
    },
    {
      id: 'pulse',
      nameKey: 'svg.items.pulse.title',
      descKey: 'svg.items.pulse.desc',
      category: 'Loader',
      params: { size: 40, color: '#EC4899', duration: 1.5 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'duration', label: 'Speed', min: 0.5, max: 3, step: 0.1 }
      ],
      getCode: p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="${p.color}" opacity="0.5">
    <animate attributeName="r" from="45" to="0" dur="${p.duration}s" repeatCount="indefinite" />
    <animate attributeName="opacity" from="0" to="1" dur="${p.duration}s" repeatCount="indefinite" />
  </circle>
</svg>`
    },

    // ================= SHAPES (装饰图形) =================
    {
      id: 'wave',
      nameKey: 'svg.items.wave.title',
      descKey: 'svg.items.wave.desc',
      category: 'Shape',
      params: { color: '#6366f1', height: 100, curve: 40 },
      controls: [
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'curve', label: 'Amp', min: 10, max: 100 }
      ],
      getCode: p => `<svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <path fill="${p.color}" fill-opacity="1" d="M0,160L80,170.7C160,181,320,203,480,192C640,181,800,139,960,138.7C1120,139,1280,181,1360,202.7L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
</svg>`
    }
  ])

  return { snippets }
}
