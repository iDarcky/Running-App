import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      // Increase the warning limit to 1600kb to accommodate large libraries
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          // Manually split large vendor chunks to improve caching and suppress warnings
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Split Recharts into its own chunk
              if (id.includes('recharts')) {
                return 'recharts';
              }
              // Split Lucide icons
              if (id.includes('lucide-react')) {
                return 'lucide';
              }
              // Split Google GenAI SDK
              if (id.includes('@google/genai')) {
                return 'genai';
              }
              // Put remaining node_modules in a vendor chunk
              return 'vendor';
            }
          },
        },
      },
    },
  };
});