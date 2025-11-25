import { reactive } from 'vue'

export interface SnippetControl {
  type: 'select' | 'color' | 'number' | 'range'
  key: string
  label: string
  options?: string[]
  min?: number
  max?: number
  step?: number
}

export interface Snippet {
  id: string
  nameKey: string // 使用 key 支持多语言
  descKey: string // 使用 key 支持多语言
  category: 'Layout' | 'Shape' | 'Text' | 'UI' | 'Effect'
  params: Record<string, any>
  controls: SnippetControl[]
  getCode: (params: any) => string
}

export const useCssSnippets = () => {
  const snippets = reactive<Snippet[]>([
    // --- Shapes ---
    {
      id: 'triangle',
      nameKey: 'snippets.items.triangle.title',
      descKey: 'snippets.items.triangle.desc',
      category: 'Shape',
      params: { direction: 'top', width: 20, color: '#FF5722' },
      controls: [
        { type: 'select', key: 'direction', label: 'Dir', options: ['top', 'bottom', 'left', 'right'] },
        { type: 'number', key: 'width', label: 'Size', min: 5, max: 100 },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => {
        const s = p.width
        const c = p.color
        const base = `width: 0;\nheight: 0;\nborder-style: solid;`
        let b = ''
        if (p.direction === 'top')
          b = `border-width: 0 ${s}px ${s}px ${s}px;\nborder-color: transparent transparent ${c} transparent;`
        else if (p.direction === 'bottom')
          b = `border-width: ${s}px ${s}px 0 ${s}px;\nborder-color: ${c} transparent transparent transparent;`
        else if (p.direction === 'left')
          b = `border-width: ${s}px ${s}px ${s}px 0;\nborder-color: transparent ${c} transparent transparent;`
        else if (p.direction === 'right')
          b = `border-width: ${s}px 0 ${s}px ${s}px;\nborder-color: transparent transparent transparent ${c};`
        return `${base}\n${b}`
      }
    },
    {
      id: 'circle',
      nameKey: 'snippets.items.circle.title',
      descKey: 'snippets.items.circle.desc',
      category: 'Shape',
      params: { size: 50, color: '#3B82F6' },
      controls: [
        { type: 'number', key: 'size', label: 'Dia (px)', min: 10, max: 200 },
        { type: 'color', key: 'color', label: 'Color' }
      ],
      getCode: p => `width: ${p.size}px;\nheight: ${p.size}px;\nbackground-color: ${p.color};\nborder-radius: 50%;`
    },

    // --- Layout ---
    {
      id: 'flex-center',
      nameKey: 'snippets.items.flex_center.title',
      descKey: 'snippets.items.flex_center.desc',
      category: 'Layout',
      params: { direction: 'row' },
      controls: [{ type: 'select', key: 'direction', label: 'Dir', options: ['row', 'column'] }],
      getCode: p => `display: flex;\njustify-content: center;\nalign-items: center;\nflex-direction: ${p.direction};`
    },
    {
      id: 'grid-center',
      nameKey: 'snippets.items.grid_center.title',
      descKey: 'snippets.items.grid_center.desc',
      category: 'Layout',
      params: {},
      controls: [],
      getCode: () => `display: grid;\nplace-items: center;`
    },
    {
      id: 'aspect-ratio',
      nameKey: 'snippets.items.aspect_ratio.title',
      descKey: 'snippets.items.aspect_ratio.desc',
      category: 'Layout',
      params: { w: 16, h: 9, fit: 'cover' },
      controls: [
        { type: 'number', key: 'w', label: 'W', min: 1 },
        { type: 'number', key: 'h', label: 'H', min: 1 },
        { type: 'select', key: 'fit', label: 'Fit', options: ['cover', 'contain'] }
      ],
      getCode: p => `aspect-ratio: ${p.w} / ${p.h};\nobject-fit: ${p.fit};`
    },

    // --- Text ---
    {
      id: 'text-truncate',
      nameKey: 'snippets.items.text_truncate.title',
      descKey: 'snippets.items.text_truncate.desc',
      category: 'Text',
      params: { width: 200 },
      controls: [{ type: 'number', key: 'width', label: 'Max Width', min: 50 }],
      getCode: p => `white-space: nowrap;\noverflow: hidden;\ntext-overflow: ellipsis;\nmax-width: ${p.width}px;`
    },
    {
      id: 'line-clamp',
      nameKey: 'snippets.items.line_clamp.title',
      descKey: 'snippets.items.line_clamp.desc',
      category: 'Text',
      params: { lines: 3 },
      controls: [{ type: 'range', key: 'lines', label: 'Lines', min: 1, max: 10 }],
      getCode: p =>
        `display: -webkit-box;\n-webkit-line-clamp: ${p.lines};\n-webkit-box-orient: vertical;\noverflow: hidden;`
    },
    {
      id: 'gradient-text',
      nameKey: 'snippets.items.gradient_text.title',
      descKey: 'snippets.items.gradient_text.desc',
      category: 'Text',
      params: { from: '#8b5cf6', to: '#ec4899', dir: 'to right' },
      controls: [
        { type: 'color', key: 'from', label: 'Start' },
        { type: 'color', key: 'to', label: 'End' },
        { type: 'select', key: 'dir', label: 'Dir', options: ['to right', 'to bottom'] }
      ],
      getCode: p =>
        `background: linear-gradient(${p.dir}, ${p.from}, ${p.to});\n-webkit-background-clip: text;\nbackground-clip: text;\ncolor: transparent;`
    },

    // --- UI/Effect ---
    {
      id: 'glass',
      nameKey: 'snippets.items.glassmorphism.title',
      descKey: 'snippets.items.glassmorphism.desc',
      category: 'Effect',
      params: { blur: 10, opacity: 0.2 },
      controls: [
        { type: 'range', key: 'blur', label: 'Blur', min: 0, max: 20 },
        { type: 'range', key: 'opacity', label: 'Op', min: 0, max: 1, step: 0.1 }
      ],
      getCode: p =>
        `background: rgba(255, 255, 255, ${p.opacity});\nbackdrop-filter: blur(${p.blur}px);\n-webkit-backdrop-filter: blur(${p.blur}px);\nborder: 1px solid rgba(255, 255, 255, 0.3);`
    },
    {
      id: 'scrollbar',
      nameKey: 'snippets.items.custom_scrollbar.title',
      descKey: 'snippets.items.custom_scrollbar.desc',
      category: 'UI',
      params: { width: 8, thumb: '#888' },
      controls: [
        { type: 'number', key: 'width', label: 'Width', min: 2, max: 20 },
        { type: 'color', key: 'thumb', label: 'Thumb' }
      ],
      getCode: p =>
        `::-webkit-scrollbar { width: ${p.width}px; }\n::-webkit-scrollbar-thumb { background: ${p.thumb}; border-radius: 4px; }`
    },
    {
      id: 'noselect',
      nameKey: 'snippets.items.no_select.title',
      descKey: 'snippets.items.no_select.desc',
      category: 'UI',
      params: {},
      controls: [],
      getCode: () => `user-select: none;\n-webkit-user-select: none;`
    }
  ])

  return { snippets }
}
