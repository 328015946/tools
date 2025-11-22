<template>
  <CheatsheetLayout :title="$t('cheatsheet.http_title')" :desc="$t('cheatsheet.http_desc')" :data="data" />
</template>

<script setup lang="ts">
  import CheatsheetLayout from '~/components/CheatsheetLayout.vue'
  const { t } = useI18n()

  const data = computed(() => [
    {
      category: t('cheatsheet_data.http.cat_1xx'),
      items: [
        { code: '100 Continue', desc: t('cheatsheet_data.http.desc_100') },
        { code: '101 Switching Protocols', desc: t('cheatsheet_data.http.desc_101') }
      ]
    },
    {
      category: t('cheatsheet_data.http.cat_2xx'),
      items: [
        { code: '200 OK', desc: t('cheatsheet_data.http.desc_200') },
        { code: '201 Created', desc: t('cheatsheet_data.http.desc_201') },
        { code: '204 No Content', desc: t('cheatsheet_data.http.desc_204') }
      ]
    },
    {
      category: t('cheatsheet_data.http.cat_3xx'),
      items: [
        { code: '301 Moved Permanently', desc: t('cheatsheet_data.http.desc_301') },
        { code: '302 Found', desc: t('cheatsheet_data.http.desc_302') },
        { code: '304 Not Modified', desc: t('cheatsheet_data.http.desc_304') }
      ]
    },
    {
      category: t('cheatsheet_data.http.cat_4xx'),
      items: [
        { code: '400 Bad Request', desc: t('cheatsheet_data.http.desc_400') },
        { code: '401 Unauthorized', desc: t('cheatsheet_data.http.desc_401') },
        { code: '403 Forbidden', desc: t('cheatsheet_data.http.desc_403') },
        { code: '404 Not Found', desc: t('cheatsheet_data.http.desc_404') }
      ]
    },
    {
      category: t('cheatsheet_data.http.cat_5xx'),
      items: [
        { code: '500 Internal Server Error', desc: t('cheatsheet_data.http.desc_500') },
        { code: '502 Bad Gateway', desc: t('cheatsheet_data.http.desc_502') },
        { code: '503 Service Unavailable', desc: t('cheatsheet_data.http.desc_503') }
      ]
    }
  ])
</script>
