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
    },
    // composables/useSvgSnippets.ts

    // ... 前面的代码保持不变 ...

    // ================= 新增: ICONS (实用图标) =================
    {
      id: 'check',
      nameKey: 'svg.items.check.title',
      descKey: 'svg.items.check.desc',
      category: 'Icon',
      params: { size: 24, stroke: 3, color: '#10B981', round: true },
      controls: [
        { type: 'number', key: 'size', label: 'Size', min: 16 },
        { type: 'number', key: 'stroke', label: 'Width', step: 0.5 },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'boolean', key: 'round', label: 'Round' }
      ],
      getCode: p => {
        const cap = p.round ? 'stroke-linecap="round" stroke-linejoin="round"' : ''
        return `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 6L9 17L4 12" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
</svg>`
      }
    },
    {
      id: 'search',
      nameKey: 'svg.items.search.title',
      descKey: 'svg.items.search.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#6B7280' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'number', key: 'stroke', label: 'Width', step: 0.5 },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="11" cy="11" r="8" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round"/>
  <path d="M21 21L16.65 16.65" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round"/>
</svg>`
    },

    // ================= 新增: LOADERS (加载动画) =================
    {
      id: 'dots-bounce',
      nameKey: 'svg.items.dots.title',
      descKey: 'svg.items.dots.desc',
      category: 'Loader',
      params: { size: 48, color: '#8B5CF6' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="4" cy="12" r="3" fill="${p.color}">
    <animate attributeName="cy" begin="0s" dur="0.6s" values="12;6;12" repeatCount="indefinite" />
  </circle>
  <circle cx="12" cy="12" r="3" fill="${p.color}">
    <animate attributeName="cy" begin="0.2s" dur="0.6s" values="12;6;12" repeatCount="indefinite" />
  </circle>
  <circle cx="20" cy="12" r="3" fill="${p.color}">
    <animate attributeName="cy" begin="0.4s" dur="0.6s" values="12;6;12" repeatCount="indefinite" />
  </circle>
</svg>`
    },
    {
      id: 'bars-audio',
      nameKey: 'svg.items.bars.title',
      descKey: 'svg.items.bars.desc',
      category: 'Loader',
      params: { size: 40, color: '#F59E0B' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="6" width="4" height="12" fill="${p.color}">
    <animate attributeName="y" values="6;2;6" dur="0.8s" repeatCount="indefinite" />
    <animate attributeName="height" values="12;20;12" dur="0.8s" repeatCount="indefinite" />
  </rect>
  <rect x="10" y="6" width="4" height="12" fill="${p.color}">
    <animate attributeName="y" values="6;2;6" dur="0.8s" begin="0.2s" repeatCount="indefinite" />
    <animate attributeName="height" values="12;20;12" dur="0.8s" begin="0.2s" repeatCount="indefinite" />
  </rect>
  <rect x="19" y="6" width="4" height="12" fill="${p.color}">
    <animate attributeName="y" values="6;2;6" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
    <animate attributeName="height" values="12;20;12" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
  </rect>
</svg>`
    },
    {
      id: 'skeleton',
      nameKey: 'svg.items.skeleton.title',
      descKey: 'svg.items.skeleton.desc',
      category: 'Loader',
      params: { width: 200, height: 20, color1: '#f3f4f6', color2: '#e5e7eb' },
      controls: [
        { type: 'number', key: 'width', label: 'Width', max: 500 },
        { type: 'number', key: 'height', label: 'Height', max: 100 },
        { type: 'color', key: 'color1', label: 'Base' },
        { type: 'color', key: 'color2', label: 'Shimmer' }
      ],
      getCode:
        p => `<svg width="${p.width}" height="${p.height}" viewBox="0 0 ${p.width} ${p.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${p.color1}" />
      <stop offset="50%" stop-color="${p.color2}" />
      <stop offset="100%" stop-color="${p.color1}" />
      <animate attributeName="x1" from="-100%" to="100%" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="x2" from="0%" to="200%" dur="1.5s" repeatCount="indefinite" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="4" fill="url(#shimmer)" />
</svg>`
    },

    // ================= 新增: PATTERNS (纹理) =================
    {
      id: 'stripes',
      nameKey: 'svg.items.stripes.title',
      descKey: 'svg.items.stripes.desc',
      category: 'Pattern',
      params: { size: 10, color: '#e5e7eb', opacity: 0.5 },
      controls: [
        { type: 'number', key: 'size', label: 'Spacing' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.1 }
      ],
      getCode: p => `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="stripes" width="${p.size}" height="${
        p.size
      }" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="${p.size}" stroke="${p.color}" stroke-width="${p.size / 2}" stroke-opacity="${
        p.opacity
      }" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#stripes)" />
</svg>`
    },
    {
      id: 'checker',
      nameKey: 'svg.items.checker.title',
      descKey: 'svg.items.checker.desc',
      category: 'Pattern',
      params: { size: 20, color1: '#ffffff', color2: '#f3f4f6' },
      controls: [
        { type: 'number', key: 'size', label: 'Size', min: 4 },
        { type: 'color', key: 'color1', label: 'Color 1' },
        { type: 'color', key: 'color2', label: 'Color 2' }
      ],
      getCode: p => `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="checker" width="${p.size * 2}" height="${p.size * 2}" patternUnits="userSpaceOnUse">
      <rect width="${p.size * 2}" height="${p.size * 2}" fill="${p.color1}" />
      <rect x="0" y="0" width="${p.size}" height="${p.size}" fill="${p.color2}" />
      <rect x="${p.size}" y="${p.size}" width="${p.size}" height="${p.size}" fill="${p.color2}" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#checker)" />
</svg>`
    },

    // ================= 新增: SHAPES (装饰) =================
    {
      id: 'blob',
      nameKey: 'svg.items.blob.title',
      descKey: 'svg.items.blob.desc',
      category: 'Shape',
      params: { color: '#FBCFE8', opacity: 1 },
      controls: [
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.1 }
      ],
      getCode: p => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path fill="${p.color}" fill-opacity="${p.opacity}" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.9C87.4,-34.7,90.1,-20.4,85.8,-7.1C81.5,6.2,70.2,18.5,60.5,29.6C50.8,40.7,42.7,50.6,33.1,58.3C23.5,66,12.4,71.5,0.4,70.8C-11.6,70.1,-24.8,63.2,-37.4,55.1C-50,47,-62,37.7,-69.8,25.4C-77.6,13.1,-81.2,-2.2,-77.8,-16.1C-74.4,-30,-64,-42.5,-52.3,-50.2C-40.6,-57.9,-27.6,-60.8,-14.8,-63.3C-2,-65.8,11.8,-67.9,25.3,-70.2Z" transform="translate(100 100)" />
</svg>`
    },
    {
      id: 'divider-curve',
      nameKey: 'svg.items.curve.title',
      descKey: 'svg.items.curve.desc',
      category: 'Shape',
      params: { color: '#3B82F6', height: 60 },
      controls: [
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'height', label: 'Depth', min: 20, max: 150 }
      ],
      getCode: p => `<svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="${p.color}"></path>
</svg>`
    },
    {
      id: 'ribbon',
      nameKey: 'svg.items.ribbon.title',
      descKey: 'svg.items.ribbon.desc',
      category: 'Shape',
      params: { text: 'NEW', color: '#EF4444', textColor: '#FFFFFF' },
      controls: [
        { type: 'select', key: 'text', label: 'Text', options: ['NEW', 'HOT', 'BETA', 'PRO'] },
        { type: 'color', key: 'color', label: 'Bg Color' },
        { type: 'color', key: 'textColor', label: 'Txt Color' }
      ],
      getCode: p => `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0 H50 L100 50 V100 L50 50 Z" fill="${p.color}" transform="rotate(-45 50 20) translate(-15 -35)"/>
  <text x="25" y="18" fill="${p.textColor}" font-family="sans-serif" font-weight="bold" font-size="14" transform="rotate(-45 35 35)">${p.text}</text>
</svg>`
    },
    // ================= 新增: WEB COMMON ICONS (常用Web图标) =================
    {
      id: 'home',
      nameKey: 'svg.items.home.title',
      descKey: 'svg.items.home.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#374151', round: true },
      controls: [
        { type: 'number', key: 'size', label: 'Size', min: 16 },
        { type: 'number', key: 'stroke', label: 'Width', step: 0.5 },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => {
        const cap = p.round ? 'stroke-linecap="round" stroke-linejoin="round"' : ''
        return `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
  <polyline points="9 22 9 12 15 12 15 22" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
</svg>`
      }
    },
    {
      id: 'user',
      nameKey: 'svg.items.user.title',
      descKey: 'svg.items.user.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#374151', round: true },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'number', key: 'stroke', label: 'Width', step: 0.5 },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => {
        const cap = p.round ? 'stroke-linecap="round" stroke-linejoin="round"' : ''
        return `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
  <circle cx="12" cy="7" r="4" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
</svg>`
      }
    },
    {
      id: 'settings',
      nameKey: 'svg.items.settings.title',
      descKey: 'svg.items.settings.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#374151' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="3" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H15a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
    },
    {
      id: 'trash',
      nameKey: 'svg.items.trash.title',
      descKey: 'svg.items.trash.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#EF4444', round: true },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => {
        const cap = p.round ? 'stroke-linecap="round" stroke-linejoin="round"' : ''
        return `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polyline points="3 6 5 6 21 6" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
  <line x1="10" y1="11" x2="10" y2="17" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
  <line x1="14" y1="11" x2="14" y2="17" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
</svg>`
      }
    },
    {
      id: 'edit',
      nameKey: 'svg.items.edit.title',
      descKey: 'svg.items.edit.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#3B82F6' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
    },
    {
      id: 'download',
      nameKey: 'svg.items.download.title',
      descKey: 'svg.items.download.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#10B981', round: true },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => {
        const cap = p.round ? 'stroke-linecap="round" stroke-linejoin="round"' : ''
        return `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
  <polyline points="7 10 12 15 17 10" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
  <line x1="12" y1="15" x2="12" y2="3" stroke="${p.color}" stroke-width="${p.stroke}" ${cap}/>
</svg>`
      }
    },
    {
      id: 'share',
      nameKey: 'svg.items.share.title',
      descKey: 'svg.items.share.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#6366F1' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="5" r="3" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="6" cy="12" r="3" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="18" cy="19" r="3" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
    },
    {
      id: 'mail',
      nameKey: 'svg.items.mail.title',
      descKey: 'svg.items.mail.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#374151' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="22,6 12,13 2,6" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
    },
    {
      id: 'link',
      nameKey: 'svg.items.link.title',
      descKey: 'svg.items.link.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#374151' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
    },
    {
      id: 'eye',
      nameKey: 'svg.items.eye.title',
      descKey: 'svg.items.eye.desc',
      category: 'Icon',
      params: { size: 24, stroke: 2, color: '#374151' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="12" r="3" stroke="${p.color}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
    },
    // ================= 新增: WEB COMMON ANIMATIONS (常用动画) =================
    {
      id: 'ring-notch',
      nameKey: 'svg.items.ring.title',
      descKey: 'svg.items.ring.desc',
      category: 'Loader',
      params: { size: 40, color: '#3B82F6', speed: 1 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'speed', label: 'Speed', min: 0.5, max: 2, step: 0.1 }
      ],
      getCode: p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  <circle cx="25" cy="25" r="20" fill="none" stroke="${p.color}" stroke-width="4" stroke-opacity="0.3" />
  <circle cx="25" cy="25" r="20" fill="none" stroke="${p.color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="30 95">
    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="${p.speed}s" repeatCount="indefinite" />
  </circle>
</svg>`
    },
    {
      id: 'sync-arrows',
      nameKey: 'svg.items.sync.title',
      descKey: 'svg.items.sync.desc',
      category: 'Loader',
      params: { size: 32, color: '#10B981', speed: 1.5 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        // 修正: 添加 step，并将标签改为 Duration (时长)
        { type: 'range', key: 'speed', label: 'Duration', min: 0.5, max: 3, step: 0.1 }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="${p.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- 上半部分箭头 -->
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <!-- 下半部分箭头 -->
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M21 21v-5h-5" />
    <!-- 旋转动画 -->
    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="${p.speed}s" repeatCount="indefinite" />
  </g>
</svg>`
    },
    {
      id: 'typing',
      nameKey: 'svg.items.typing.title',
      descKey: 'svg.items.typing.desc',
      category: 'Loader',
      params: { size: 48, color: '#6B7280', speed: 0.8 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'speed', label: 'Speed', min: 0.4, max: 1.5 }
      ],
      getCode: p => `<svg width="${p.size}" height="${
        p.size / 2
      }" viewBox="0 0 24 12" xmlns="http://www.w3.org/2000/svg">
  <circle cx="4" cy="6" r="2" fill="${p.color}">
    <animate attributeName="cy" values="6;3;6" dur="${p.speed}s" begin="0s" repeatCount="indefinite" />
  </circle>
  <circle cx="12" cy="6" r="2" fill="${p.color}">
    <animate attributeName="cy" values="6;3;6" dur="${p.speed}s" begin="0.2s" repeatCount="indefinite" />
  </circle>
  <circle cx="20" cy="6" r="2" fill="${p.color}">
    <animate attributeName="cy" values="6;3;6" dur="${p.speed}s" begin="0.4s" repeatCount="indefinite" />
  </circle>
</svg>`
    },
    {
      id: 'wifi-signal',
      nameKey: 'svg.items.wifi.title',
      descKey: 'svg.items.wifi.desc',
      category: 'Loader',
      params: { size: 32, color: '#F59E0B', speed: 1.5 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'speed', label: 'Speed' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 18C13.1046 18 14 17.1046 14 16C14 14.8954 13.1046 14 12 14C10.8954 14 10 14.8954 10 16C10 17.1046 10.8954 18 12 18Z" fill="${p.color}">
    <animate attributeName="opacity" values="0.3;1;0.3" dur="${p.speed}s" repeatCount="indefinite" />
  </path>
  <path d="M16.24 12.5C15.11 11.38 13.62 10.75 12 10.75C10.38 10.75 8.89 11.38 7.76 12.5" stroke="${p.color}" stroke-width="2" stroke-linecap="round">
    <animate attributeName="opacity" values="0.3;1;0.3" dur="${p.speed}s" begin="0.2s" repeatCount="indefinite" />
  </path>
  <path d="M19.07 9.68C17.26 7.88 14.73 6.88 12 6.88C9.27 6.88 6.74 7.88 4.93 9.68" stroke="${p.color}" stroke-width="2" stroke-linecap="round">
    <animate attributeName="opacity" values="0.3;1;0.3" dur="${p.speed}s" begin="0.4s" repeatCount="indefinite" />
  </path>
</svg>`
    },
    {
      id: 'upload-cloud',
      nameKey: 'svg.items.upload.title',
      descKey: 'svg.items.upload.desc',
      category: 'Loader',
      params: { size: 40, color: '#6366F1', speed: 1.5 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'speed', label: 'Speed' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.132 20.177 10.244 17.8 10.05C17.4 6.96 14.86 4.5 11.75 4.5C8.895 4.5 6.55 6.46 5.85 9.17C3.07 9.5 1 11.9 1 14.75C1 17.65 3.35 20 6.25 20H10" stroke="${p.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 21V11M12 11L9 14M12 11L15 14" stroke="${p.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <animate attributeName="d" values="M12 21V11M12 11L9 14M12 11L15 14; M12 16V6M12 6L9 9M12 6L15 9; M12 21V11M12 11L9 14M12 11L15 14" dur="${p.speed}s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0;1" dur="${p.speed}s" repeatCount="indefinite" />
  </path>
</svg>`
    },
    {
      id: 'square-spin',
      nameKey: 'svg.items.square.title',
      descKey: 'svg.items.square.desc',
      category: 'Loader',
      params: { size: 32, color: '#EC4899', speed: 2 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'speed', label: 'Speed' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="20" height="20" rx="4" stroke="${p.color}" stroke-width="2">
    <animateTransform attributeName="transform" type="rotate" values="0 12 12; 180 12 12; 360 12 12" dur="${p.speed}s" repeatCount="indefinite" calcMode="spline" keySplines="0.45, 0.05, 0.55, 0.95; 0.45, 0.05, 0.55, 0.95" />
    <animate attributeName="stroke-dasharray" values="0 80; 80 80; 0 80" dur="${p.speed}s" repeatCount="indefinite" />
  </rect>
</svg>`
    },
    {
      id: 'gear-spin',
      nameKey: 'svg.items.gear.title',
      descKey: 'svg.items.gear.desc',
      category: 'Loader',
      // 修改 1: 默认速度改为 3秒
      params: { size: 32, color: '#4B5563', speed: 3 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        // 修改 2: 调整范围。0.5s(极快) ~ 5s(慢)。
        // 建议标签改为 'Duration' (时长) 更准确，因为数值越大转得越慢
        { type: 'range', key: 'speed', label: 'Duration', min: 0.5, max: 5, step: 0.5 }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="${p.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- 外圈齿轮 -->
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H15a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    <!-- 内圈圆孔 -->
    <circle cx="12" cy="12" r="3" />
    <!-- 旋转动画 -->
    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="${p.speed}s" repeatCount="indefinite" />
  </g>
</svg>`
    },
    {
      id: 'heart-beat',
      nameKey: 'svg.items.heart.title',
      descKey: 'svg.items.heart.desc',
      category: 'Loader',
      params: { size: 32, color: '#EF4444', speed: 0.8 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        // ✅ 修正：添加 min, max, step
        // 范围 0.2秒(极快) 到 2秒(慢)，步长 0.1秒
        { type: 'range', key: 'speed', label: 'Duration', min: 0.2, max: 2, step: 0.1 }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="-3 -3 30 30" fill="${p.color}" xmlns="http://www.w3.org/2000/svg">
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" style="transform-origin: center">
    <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="${p.speed}s" repeatCount="indefinite" />
  </path>
</svg>`
    },
    {
      id: 'hourglass',
      nameKey: 'svg.items.hourglass.title',
      descKey: 'svg.items.hourglass.desc',
      category: 'Loader',
      params: { size: 32, color: '#8B5CF6', speed: 2 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'speed', label: 'Speed' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 22H19M5 2H19M17 22L7 2M17 2L7 22" stroke="${p.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <animateTransform attributeName="transform" type="rotate" values="0 12 12; 180 12 12; 180 12 12" dur="${p.speed}s" repeatCount="indefinite" />
  </path>
</svg>`
    },
    {
      id: 'infinity-loop',
      nameKey: 'svg.items.infinity.title',
      descKey: 'svg.items.infinity.desc',
      category: 'Loader',
      params: { size: 48, color: '#06B6D4', speed: 1.5 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'speed', label: 'Speed' }
      ],
      getCode: p => `<svg width="${p.size}" height="${
        p.size / 2
      }" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M25,25 C25,38.8 45,38.8 50,25 C55,11.2 75,11.2 75,25 C75,38.8 55,38.8 50,25 C45,11.2 25,11.2 25,25" stroke="${
    p.color
  }" stroke-width="4" stroke-linecap="round" stroke-dasharray="200" stroke-dashoffset="0">
    <animate attributeName="stroke-dashoffset" from="400" to="0" dur="${p.speed}s" repeatCount="indefinite" />
  </path>
</svg>`
    },
    // ================= 新增: WEB COMMON SHAPES (常用网页形状) =================

    // 1. 斜切分割线 (Slant Divider) - 现代网页最常用的区块分割
    {
      id: 'shape-slant',
      nameKey: 'svg.items.slant.title',
      descKey: 'svg.items.slant.desc',
      category: 'Shape',
      params: { color: '#F3F4F6', height: 100, direction: 'right' },
      controls: [
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'height', label: 'Height', min: 20, max: 200 },
        { type: 'select', key: 'direction', label: 'Dir', options: ['right', 'left'] }
      ],
      getCode: p => {
        const d = p.direction === 'right' ? 'M0,100 L0,0 L100,100 Z' : 'M0,100 L100,0 L100,100 Z'
        return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${d}" fill="${p.color}" />
</svg>`
      }
    },

    // 2. 锯齿分割线 (Zigzag) - 用于优惠券、小票或活泼风格
    {
      id: 'shape-zigzag',
      nameKey: 'svg.items.zigzag.title',
      descKey: 'svg.items.zigzag.desc',
      category: 'Shape',
      params: { color: '#F3F4F6', height: 20, points: 20 },
      controls: [
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'height', label: 'Height', min: 10, max: 50 },
        { type: 'range', key: 'points', label: 'Density', min: 5, max: 50, step: 5 }
      ],
      getCode: p => `<svg width="100%" height="${p.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="zigzag" x="0" y="0" width="${400 / p.points}" height="${p.height}" patternUnits="userSpaceOnUse">
      <path d="M0 0 L${200 / p.points} ${p.height} L${400 / p.points} 0 V${p.height} H0 Z" fill="${p.color}" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#zigzag)" />
</svg>`
    },

    // 3. 云朵/波浪分割线 (Clouds) - 更加圆润的底部装饰
    {
      id: 'shape-clouds',
      nameKey: 'svg.items.clouds.title',
      descKey: 'svg.items.clouds.desc',
      category: 'Shape',
      params: { color: '#F3F4F6' },
      controls: [{ type: 'color', key: 'color', label: 'Color' }],
      getCode: p => `<svg viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path fill="${p.color}" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
</svg>`
    },

    // 4. 气泡对话框 (Speech Bubble) - 用于引用、评价或提示
    // 4. 气泡对话框 (Speech Bubble) - 升级版：支持文字
    {
      id: 'shape-bubble',
      nameKey: 'svg.items.bubble.title',
      descKey: 'svg.items.bubble.desc',
      category: 'Shape',
      // 新增 text 和 textColor 参数
      params: { width: 120, height: 60, color: '#3B82F6', text: 'Hello', textColor: '#FFFFFF', tail: 'bottom' },
      controls: [
        { type: 'select', key: 'tail', label: 'Tail', options: ['bottom', 'left'] }, // 把方向放前面
        { type: 'select', key: 'text', label: 'Text', options: ['Hello', 'Hi', 'Beta', 'New', 'Tips'] }, // 简单的预设，或者您可以改成输入框组件(如果支持的话)
        // 注意：如果您想自由输入文字，您可能需要在 SnippetControl 接口里加一个 'text' 类型，或者暂时用 select 凑合
        { type: 'number', key: 'width', label: 'Width', min: 60 },
        { type: 'number', key: 'height', label: 'Height', min: 40 },
        { type: 'color', key: 'color', label: 'Bg Color' },
        { type: 'color', key: 'textColor', label: 'Txt Color' }
      ],
      getCode: p => {
        const w = p.width,
          h = p.height
        // 路径生成逻辑
        const path =
          p.tail === 'bottom'
            ? `M0 10 A10 10 0 0 1 10 0 H${w - 10} A10 10 0 0 1 ${w} 10 V${h - 10} A10 10 0 0 1 ${w - 10} ${h} H${
                w / 2 + 10
              } L${w / 2} ${h + 10} L${w / 2 - 10} ${h} H10 A10 10 0 0 1 0 ${h - 10} Z`
            : `M10 0 H${w - 10} A10 10 0 0 1 ${w} 10 V${h - 10} A10 10 0 0 1 ${w - 10} ${h} H10 A10 10 0 0 1 0 ${
                h - 10
              } V${h / 2 + 10} L-10 ${h / 2} L0 ${h / 2 - 10} V10 A10 10 0 0 1 10 0 Z`

        // viewBox 逻辑
        const vb = p.tail === 'bottom' ? `-5 -5 ${w + 10} ${h + 20}` : `-15 -5 ${w + 20} ${h + 10}`

        // 文字坐标计算
        // 如果尾巴在下面，文字中心就是 w/2, h/2
        // 如果尾巴在左边，文字中心也是 w/2, h/2 (因为 path 也是基于 0,0 开始画主体的)
        const cx = w / 2
        const cy = h / 2

        return `<svg width="${w}" height="${h}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">
  <path d="${path}" fill="${p.color}" />
  <text x="${cx}" y="${cy}" fill="${p.textColor}" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle" dominant-baseline="middle">${p.text}</text>
</svg>`
      }
    },

    // 5. 手绘下划线/涂鸦 (Squiggle) - 用于强调文字
    {
      id: 'shape-squiggle',
      nameKey: 'svg.items.squiggle.title',
      descKey: 'svg.items.squiggle.desc',
      category: 'Shape',
      params: { width: 120, color: '#F59E0B', stroke: 4 },
      controls: [
        { type: 'number', key: 'width', label: 'Width' },
        { type: 'number', key: 'stroke', label: 'Thick', min: 2, max: 8 },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode:
        p => `<svg width="${p.width}" height="20" viewBox="0 0 120 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 14C18 6 30 18 50 12C65 8 80 18 116 6" stroke="${p.color}" stroke-width="${p.stroke}" fill="none" stroke-linecap="round" />
</svg>`
    },

    // 6. 徽章/奖牌形状 (Badge) - 用于显示价格、排名或“New”
    {
      id: 'shape-badge',
      nameKey: 'svg.items.badge.title',
      descKey: 'svg.items.badge.desc',
      category: 'Shape',
      params: { size: 64, color: '#EC4899' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" fill="${p.color}" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
</svg>`
    },

    // 7. 同心圆 (Concentric Circles) - 常用作背景焦点
    {
      id: 'shape-concentric',
      nameKey: 'svg.items.concentric.title',
      descKey: 'svg.items.concentric.desc',
      category: 'Shape',
      params: { size: 100, color: '#3B82F6', opacity: 0.2 },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'range', key: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.1 }
      ],
      getCode:
        p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="48" stroke="${p.color}" stroke-width="2" stroke-opacity="${p.opacity}" />
  <circle cx="50" cy="50" r="35" stroke="${p.color}" stroke-width="2" stroke-opacity="${p.opacity}" />
  <circle cx="50" cy="50" r="22" stroke="${p.color}" stroke-width="2" stroke-opacity="${p.opacity}" />
  <circle cx="50" cy="50" r="10" fill="${p.color}" fill-opacity="${p.opacity}" />
</svg>`
    },

    // 8. 角落点阵 (Corner Dots) - SaaS 网站最常用的背景装饰
    {
      id: 'shape-dots-grid',
      nameKey: 'svg.items.dotsgrid.title',
      descKey: 'svg.items.dotsgrid.desc',
      category: 'Shape',
      params: { size: 20, color: '#9CA3AF' },
      controls: [
        { type: 'number', key: 'size', label: 'Gap' },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dotGrid" width="${p.size}" height="${p.size}" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="2" fill="${p.color}" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#dotGrid)" />
</svg>`
    },

    // 9. 六边形 (Hexagon) - 科技感/现代感背景
    {
      id: 'shape-hexagon',
      nameKey: 'svg.items.hex.title',
      descKey: 'svg.items.hex.desc',
      category: 'Shape',
      params: { size: 64, color: '#10B981', fill: false },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color', label: 'Color' },
        { type: 'boolean', key: 'fill', label: 'Fill' }
      ],
      getCode: p => {
        const attr = p.fill ? `fill="${p.color}"` : `stroke="${p.color}" stroke-width="2" fill="none"`
        return `<svg width="${p.size}" height="${p.size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 16V8l-9-5l-9 5v8l9 5l9-5z" ${attr} stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
      }
    },

    // 10. 柔光弥散 (Gradient Blob) - Glassmorphism 风格背景
    {
      id: 'shape-blur-blob',
      nameKey: 'svg.items.blurblob.title',
      descKey: 'svg.items.blurblob.desc',
      category: 'Shape',
      params: { size: 100, color1: '#8B5CF6', color2: '#3B82F6' },
      controls: [
        { type: 'number', key: 'size', label: 'Size' },
        { type: 'color', key: 'color1', label: 'Color 1' },
        { type: 'color', key: 'color2', label: 'Color 2' }
      ],
      getCode: p => `<svg width="${p.size}" height="${p.size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="gradBlob" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" style="stop-color:${p.color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${p.color2};stop-opacity:0" />
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#gradBlob)" style="filter: blur(8px);" />
</svg>`
    }
  ])

  return { snippets }
}
