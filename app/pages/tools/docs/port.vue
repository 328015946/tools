<template>
  <CheatsheetLayout :title="$t('cheatsheet.port_title')" :desc="$t('cheatsheet.port_desc')" :data="data" />
</template>
<script setup lang="ts">
  import CheatsheetLayout from '~/components/CheatsheetLayout.vue'
  const { t } = useI18n()
  const data = computed(() => [
    {
      category: t('cheatsheet_data.port.cat_db'),
      items: [
        { code: '3306', desc: t('cheatsheet_data.port.desc_3306') },
        { code: '6379', desc: t('cheatsheet_data.port.desc_6379') },
        { code: '27017', desc: t('cheatsheet_data.port.desc_27017') },
        { code: '5432', desc: t('cheatsheet_data.port.desc_5432') },
        { code: '9200', desc: t('cheatsheet_data.port.desc_9200') },
        { code: '8080', desc: t('cheatsheet_data.port.desc_8080') }
      ]
    },
    {
      category: t('cheatsheet_data.port.cat_system'),
      items: [
        { code: '22', desc: t('cheatsheet_data.port.desc_22') },
        { code: '80', desc: t('cheatsheet_data.port.desc_80') },
        { code: '443', desc: t('cheatsheet_data.port.desc_443') },
        { code: '21', desc: t('cheatsheet_data.port.desc_21') },
        { code: '53', desc: t('cheatsheet_data.port.desc_53') },
        { code: '25', desc: t('cheatsheet_data.port.desc_25') }
      ]
    }
  ])
</script>
