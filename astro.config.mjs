// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { placeholders } from './src/lib/md-placeholders.mjs';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://skmagnetic.com',
  // Clean, consistent URLs: /products/category/product-name/
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  markdown: {
    processor: satteri({ mdastPlugins: [placeholders] }),
  },
});
