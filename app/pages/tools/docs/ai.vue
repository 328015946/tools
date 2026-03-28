<template>
  <CheatsheetLayout :title="$t('cheatsheet.ai_title')" :desc="$t('cheatsheet.ai_desc')" :data="data" />
</template>

<script setup lang="ts">
  import CheatsheetLayout from '~/components/CheatsheetLayout.vue'
  const { t } = useI18n()

  const data = computed(() => [
    {
      category: t('cheatsheet_data.ai.cat_gemini_install'),
      items: [
        { code: 'npm install -g @google/gemini-cli', desc: t('cheatsheet_data.ai.desc_gemini_npm') },
        { code: 'gemini', desc: t('cheatsheet_data.ai.desc_gemini_auth') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_claude_install'),
      items: [
        { code: 'npm install -g @anthropic-ai/claude-code', desc: t('cheatsheet_data.ai.desc_claude_npm') },
        { code: 'claude', desc: t('cheatsheet_data.ai.desc_claude_auth') },
        { code: 'irm https://claude.ai/install.ps1 | iex', desc: 'Windows (PowerShell) 官方安装脚本' }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_deepseek_install'),
      items: [
        { code: 'ollama run deepseek-r1:7b', desc: t('cheatsheet_data.ai.desc_deepseek_ollama') },
        { code: 'npm install -g run-deepseek-cli', desc: t('cheatsheet_data.ai.desc_deepseek_npm') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_groq_install'),
      items: [
        { code: 'npx groq-code-cli@latest', desc: t('cheatsheet_data.ai.desc_groq_npm') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_openrouter_install'),
      items: [
        { code: 'npm install -g @openrouter/cli', desc: t('cheatsheet_data.ai.desc_openrouter_npm') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_env_config'),
      items: [
        {
          code: '[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api.example.com", [System.EnvironmentVariableTarget]::User)',
          desc: t('cheatsheet_data.ai.desc_env_win')
        },
        {
          code: '[System.Environment]::SetEnvironmentVariable("DEEPSEEK_API_KEY", "sk-...", [System.EnvironmentVariableTarget]::User)',
          desc: 'Windows 设置 DeepSeek API Key'
        },
        {
          code: 'export ANTHROPIC_BASE_URL="https://api.example.com"',
          desc: t('cheatsheet_data.ai.desc_env_mac')
        },
        {
          code: 'export DEEPSEEK_API_KEY="sk-..."',
          desc: 'macOS/Linux 设置 API Key'
        }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_kimi_install'),
      items: [
        { code: 'pip install --upgrade openai', desc: t('cheatsheet_data.ai.desc_kimi_pip') },
        { code: 'export MOONSHOT_API_KEY="sk-..."', desc: t('cheatsheet_data.ai.desc_kimi_env') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_qwen_install'),
      items: [
        { code: 'pip install dashscope', desc: t('cheatsheet_data.ai.desc_qwen_pip') },
        { code: 'export DASHSCOPE_API_KEY="sk-..."', desc: t('cheatsheet_data.ai.desc_qwen_env') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_ernie_install'),
      items: [
        { code: 'pip install qianfan', desc: t('cheatsheet_data.ai.desc_ernie_pip') },
        { code: 'pip install erniebot-sdk', desc: t('cheatsheet_data.ai.desc_ernie_alt') },
        { code: 'export QIANFAN_ACCESS_KEY="..."', desc: t('cheatsheet_data.ai.desc_ernie_env') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_zhipu_install'),
      items: [
        { code: 'pip install zhipuai', desc: t('cheatsheet_data.ai.desc_zhipu_pip') },
        { code: 'export ZHIPUAI_API_KEY="..."', desc: t('cheatsheet_data.ai.desc_zhipu_env') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_spark_install'),
      items: [
        { code: 'pip install spark-ai-python', desc: t('cheatsheet_data.ai.desc_spark_official') },
        { code: 'pip install sparkapi-python', desc: t('cheatsheet_data.ai.desc_spark_community') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_api_examples'),
      items: [
        {
          code: `import openai

client = openai.OpenAI(
    api_key="sk-...",
    base_url="https://api.moonshot.cn/v1"
)

response = client.chat.completions.create(
    model="moonshot-v1-8k",
    messages=[{"role": "user", "content": "Hello"}]
)`,
          desc: t('cheatsheet_data.ai.desc_kimi_python')
        },
        {
          code: `import dashscope

response = dashscope.Generation.call(
    model='qwen-turbo',
    prompt='你好',
    max_tokens=100
)`,
          desc: t('cheatsheet_data.ai.desc_qwen_python')
        },
        {
          code: `from zhipuai import ZhipuAI

client = ZhipuAI(api_key="...")
response = client.chat.completions.create(
    model="glm-4",
    messages=[{"role": "user", "content": "你好"}]
)`,
          desc: t('cheatsheet_data.ai.desc_zhipu_python')
        },
        {
          code: `// JavaScript/Node.js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-...',
  baseURL: 'https://api.deepseek.com/v1'
});

const response = await client.chat.completions.create({
  model: 'deepseek-chat',
  messages: [{ role: 'user', content: 'Hello' }]
});`,
          desc: t('cheatsheet_data.ai.desc_deepseek_js')
        }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_cursor'),
      items: [
        { code: 'Ctrl/Cmd + K', desc: t('cheatsheet_data.ai.desc_cursor_inline') },
        { code: 'Ctrl/Cmd + L', desc: t('cheatsheet_data.ai.desc_cursor_chat') },
        { code: 'Ctrl/Cmd + I', desc: t('cheatsheet_data.ai.desc_cursor_composer') },
        { code: '@Codebase', desc: t('cheatsheet_data.ai.desc_cursor_codebase') },
        { code: '@Docs', desc: t('cheatsheet_data.ai.desc_cursor_docs') },
        { code: '@Web', desc: t('cheatsheet_data.ai.desc_cursor_web') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_copilot'),
      items: [
        { code: 'Ctrl/Cmd + I', desc: t('cheatsheet_data.ai.desc_copilot_inline') },
        { code: 'Tab', desc: t('cheatsheet_data.ai.desc_copilot_accept') },
        { code: 'Alt + ]', desc: t('cheatsheet_data.ai.desc_copilot_next') },
        { code: '/explain', desc: t('cheatsheet_data.ai.desc_copilot_explain') },
        { code: '/fix', desc: t('cheatsheet_data.ai.desc_copilot_fix') },
        { code: '/tests', desc: t('cheatsheet_data.ai.desc_copilot_tests') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_ollama'),
      items: [
        { code: 'ollama list', desc: t('cheatsheet_data.ai.desc_ollama_list') },
        { code: 'ollama pull llama3.2', desc: t('cheatsheet_data.ai.desc_ollama_pull') },
        { code: 'ollama run llama3.2', desc: t('cheatsheet_data.ai.desc_ollama_run') },
        { code: 'ollama rm llama3.2', desc: t('cheatsheet_data.ai.desc_ollama_rm') },
        { code: 'ollama ps', desc: t('cheatsheet_data.ai.desc_ollama_ps') },
        { code: 'ollama serve', desc: t('cheatsheet_data.ai.desc_ollama_serve') }
      ]
    },
    {
      category: t('cheatsheet_data.ai.cat_prompt'),
      items: [
        { code: t('cheatsheet_data.ai.prompt_role'), desc: t('cheatsheet_data.ai.desc_prompt_role') },
        { code: t('cheatsheet_data.ai.prompt_task'), desc: t('cheatsheet_data.ai.desc_prompt_task') },
        { code: t('cheatsheet_data.ai.prompt_context'), desc: t('cheatsheet_data.ai.desc_prompt_context') },
        { code: t('cheatsheet_data.ai.prompt_format'), desc: t('cheatsheet_data.ai.desc_prompt_format') },
        { code: t('cheatsheet_data.ai.prompt_example'), desc: t('cheatsheet_data.ai.desc_prompt_example') }
      ]
    }
  ])
</script>
