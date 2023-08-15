/** @type { import('@storybook/vue').Preview } */

import Vuex from 'vuex';
import Vue from 'vue';

Vue.use(Vuex);

import '../lib/matter.css';

module = {}; // (use module.exports)

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
