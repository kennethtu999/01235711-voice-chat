/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'tiffany-blue': '#5fdad4',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        voicechat: {
          // 主色調 - 深藍色
          primary: '#1e3a8a', // 深藍色
          'primary-content': '#ffffff',

          // 次要色調 - 淺藍色
          secondary: '#3b82f6', // 藍色
          'secondary-content': '#ffffff',

          // 強調色 - 綠色
          accent: '#059669', // 綠色
          'accent-content': '#ffffff',

          // 中性色調
          neutral: '#374151', // 深灰色
          'neutral-content': '#ffffff',

          // 背景色調 - 白色系
          'base-100': '#ffffff', // 純白
          'base-200': '#f8fafc', // 淺灰白
          'base-300': '#e2e8f0', // 淺灰

          // 狀態色調
          info: '#0ea5e9', // 天藍色
          success: '#10b981', // 綠色
          warning: '#f59e0b', // 橙色
          error: '#ef4444', // 紅色
        },
      },
      'light',
      'dark',
      'cupcake',
    ],
  },
};
