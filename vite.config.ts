import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '', // use relative paths
  plugins: [react()],
  server: {
    port: 7001,
  },
});
