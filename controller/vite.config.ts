import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import react from '@vitejs/plugin-react'
import { ViteMinifyPlugin } from 'vite-plugin-minify'

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    ViteMinifyPlugin({})

  ],
  build: {
    outDir: './toESP32/'
  }
})
