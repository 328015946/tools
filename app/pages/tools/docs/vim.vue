<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 16:17:08
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 16:17:19
 * @FilePath: \xiao-nuxt4\app\pages\tools\docs\vim.vue
 * @Description: 注释
-->
<template>
  <CheatsheetLayout :title="$t('cheatsheet.vim_title')" :desc="$t('cheatsheet.vim_desc')" :data="data" />
</template>
<script setup lang="ts">
  import CheatsheetLayout from '~/components/CheatsheetLayout.vue'
  const { t } = useI18n()
  const data = computed(() => [
    {
      category: t('cheatsheet_data.vim.cat_mode'),
      items: [
        { code: 'i', desc: t('cheatsheet_data.vim.desc_i') },
        { code: 'Esc', desc: t('cheatsheet_data.vim.desc_esc') },
        { code: 'v', desc: t('cheatsheet_data.vim.desc_v') }
      ]
    },
    {
      category: t('cheatsheet_data.vim.cat_edit'),
      items: [
        { code: ':wq', desc: t('cheatsheet_data.vim.desc_wq') },
        { code: 'dd', desc: t('cheatsheet_data.vim.desc_dd') },
        { code: 'yy', desc: t('cheatsheet_data.vim.desc_yy') },
        { code: 'p', desc: t('cheatsheet_data.vim.desc_p') },
        { code: 'u', desc: t('cheatsheet_data.vim.desc_u') }
      ]
    },
    {
      category: t('cheatsheet_data.vim.cat_nav'),
      items: [
        { code: 'gg', desc: t('cheatsheet_data.vim.desc_gg') },
        { code: 'G', desc: t('cheatsheet_data.vim.desc_G') },
        { code: '0', desc: t('cheatsheet_data.vim.desc_0') },
        { code: '$', desc: t('cheatsheet_data.vim.desc_dollar') }
      ]
    }
  ])
</script>
