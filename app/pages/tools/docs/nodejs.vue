<template>
  <CheatsheetLayout :title="$t('cheatsheet.nodejs_title')" :desc="$t('cheatsheet.nodejs_desc')" :data="data" />
</template>

<script setup lang="ts">
  import CheatsheetLayout from '~/components/CheatsheetLayout.vue'
  const { t } = useI18n()

  const data = computed(() => [
    {
      category: t('cheatsheet_data.nodejs.cat_install'),
      items: [
        { code: 'node -v', desc: t('cheatsheet_data.nodejs.desc_version') },
        { code: 'npm -v', desc: t('cheatsheet_data.nodejs.desc_npm_version') },
        { code: 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -', desc: t('cheatsheet_data.nodejs.desc_linux_install') },
        { code: 'brew install node', desc: t('cheatsheet_data.nodejs.desc_mac_install') }
      ]
    },
    {
      category: t('cheatsheet_data.nodejs.cat_nvm'),
      items: [
        { code: 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash', desc: t('cheatsheet_data.nodejs.desc_nvm_install') },
        { code: 'nvm install 20', desc: t('cheatsheet_data.nodejs.desc_nvm_install_node') },
        { code: 'nvm use 20', desc: t('cheatsheet_data.nodejs.desc_nvm_use') },
        { code: 'nvm ls', desc: t('cheatsheet_data.nodejs.desc_nvm_list') },
        { code: 'nvm alias default 20', desc: t('cheatsheet_data.nodejs.desc_nvm_default') },
        { code: 'nvm uninstall 18', desc: t('cheatsheet_data.nodejs.desc_nvm_uninstall') }
      ]
    },
    {
      category: t('cheatsheet_data.nodejs.cat_npm'),
      items: [
        { code: 'npm init', desc: t('cheatsheet_data.nodejs.desc_npm_init') },
        { code: 'npm install <package>', desc: t('cheatsheet_data.nodejs.desc_npm_install') },
        { code: 'npm install -g <package>', desc: t('cheatsheet_data.nodejs.desc_npm_global') },
        { code: 'npm uninstall <package>', desc: t('cheatsheet_data.nodejs.desc_npm_uninstall') },
        { code: 'npm update', desc: t('cheatsheet_data.nodejs.desc_npm_update') },
        { code: 'npm list', desc: t('cheatsheet_data.nodejs.desc_npm_list') },
        { code: 'npm outdated', desc: t('cheatsheet_data.nodejs.desc_npm_outdated') }
      ]
    }
  ])
</script>
