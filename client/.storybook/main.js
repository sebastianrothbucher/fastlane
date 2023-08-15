/** @type { import('@storybook/vue-vite').StorybookConfig } */
import { mergeConfig } from 'vite';
import { default as vuePlugin } from '@vitejs/plugin-vue2';

const config = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/vue-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [vuePlugin()],
    });
  },
};
export default config;
