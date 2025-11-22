<template>
  <CheatsheetLayout :title="$t('cheatsheet.linux_title')" :desc="$t('cheatsheet.linux_desc')" :data="data" />
</template>

<script setup lang="ts">
  import CheatsheetLayout from '~/components/CheatsheetLayout.vue'
  const { t } = useI18n()

  const data = computed(() => [
    {
      category: t('cheatsheet_data.linux.cat_file'),
      items: [
        { code: 'ls -lah', desc: t('cheatsheet_data.linux.desc_ls') },
        { code: 'cp -r source dest', desc: t('cheatsheet_data.linux.desc_cp') },
        { code: 'mv source dest', desc: t('cheatsheet_data.linux.desc_mv') },
        { code: 'rm -rf <dir>', desc: t('cheatsheet_data.linux.desc_rm') }
      ]
    },
    {
      category: t('cheatsheet_data.linux.cat_perm'),
      items: [
        { code: 'chmod 755 file', desc: t('cheatsheet_data.linux.desc_chmod') },
        { code: 'chown user:group file', desc: t('cheatsheet_data.linux.desc_chown') }
      ]
    },
    {
      category: t('cheatsheet_data.linux.cat_net'),
      items: [
        { code: 'ping <host>', desc: t('cheatsheet_data.linux.desc_ping') },
        { code: 'netstat -tuln', desc: t('cheatsheet_data.linux.desc_netstat') },
        { code: 'curl -I <url>', desc: t('cheatsheet_data.linux.desc_curl') }
      ]
    }
  ])
</script>
