// composables/useCopy.ts
import { toast } from 'vue-sonner'

export const useCopy = () => {
  const { t } = useI18n()

  // 用于控制按钮状态（变成绿色对勾 ✅）
  const copied = ref(false)

  /**
   * 复制文本到剪贴板
   * @param text 要复制的文本
   * @param showToast 是否显示提示框 (默认为 true)
   */
  const copyToClipboard = async (text: string, showToast: boolean = true) => {
    if (!text) {
      if (showToast) toast.warning(t('global.empty_text'))
      return
    }

    try {
      await navigator.clipboard.writeText(text)

      // 1. 触发 UI 状态变化 (按钮变绿)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)

      // 2. 弹出提示框
      if (showToast) {
        toast.success(t('global.copy_success'))
      }
    } catch (err) {
      console.error('Copy failed:', err)
      if (showToast) {
        toast.error(t('global.copy_fail'))
      }
    }
  }

  return {
    copied,
    copyToClipboard
  }
}
