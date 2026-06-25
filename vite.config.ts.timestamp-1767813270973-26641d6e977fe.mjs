// vite.config.ts
import { defineConfig } from "file:///C:/Furru/Project/fici_react/fici_ui/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Furru/Project/fici_react/fici_ui/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Furru/Project/fici_react/fici_ui/node_modules/@tailwindcss/vite/dist/index.mjs";
import tsconfigPaths from "file:///C:/Furru/Project/fici_react/fici_ui/node_modules/vite-tsconfig-paths/dist/index.js";
import path from "path";
import { nodePolyfills } from "file:///C:/Furru/Project/fici_react/fici_ui/node_modules/vite-plugin-node-polyfills/dist/index.js";
var __vite_injected_original_dirname = "C:\\Furru\\Project\\fici_react\\fici_ui";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths({
      loose: true
    }),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ["buffer"],
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true
    })
  ],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__vite_injected_original_dirname, "./src").replace(/\\/g, "/")
      },
      {
        find: "@lib",
        replacement: path.resolve(__vite_injected_original_dirname, "./src/lib").replace(/\\/g, "/")
      }
    ]
  },
  server: {
    hmr: {
      overlay: true
      // Enable HMR overlay for better debugging
    }
    // Removed usePolling as it can cause issues
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
    exclude: ["@supabase/realtime-js"]
  },
  build: {
    rollupOptions: {
      external: (id) => {
        return ["stream", "http", "https", "url", "zlib", "util", "events", "assert"].includes(id);
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"]
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      extensions: [".js", ".cjs"],
      strictRequires: true,
      transformMixedEsModules: true
    }
  },
  define: {
    global: "globalThis"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxGdXJydVxcXFxQcm9qZWN0XFxcXGZpY2lfcmVhY3RcXFxcZmljaV91aVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcRnVycnVcXFxcUHJvamVjdFxcXFxmaWNpX3JlYWN0XFxcXGZpY2lfdWlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L0Z1cnJ1L1Byb2plY3QvZmljaV9yZWFjdC9maWNpX3VpL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB0YWlsd2luZGNzcygpLFxuICAgIHRzY29uZmlnUGF0aHMoe1xuICAgICAgbG9vc2U6IHRydWVcbiAgICB9KSxcbiAgICBub2RlUG9seWZpbGxzKHtcbiAgICAgIC8vIFRvIGFkZCBvbmx5IHNwZWNpZmljIHBvbHlmaWxscywgYWRkIHRoZW0gaGVyZS4gSWYgbm8gb3B0aW9uIGlzIHBhc3NlZCwgYWRkcyBhbGwgcG9seWZpbGxzXG4gICAgICBpbmNsdWRlOiBbJ2J1ZmZlciddLFxuICAgICAgLy8gV2hldGhlciB0byBwb2x5ZmlsbCBgbm9kZTpgIHByb3RvY29sIGltcG9ydHMuXG4gICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczogW1xuICAgICAge1xuICAgICAgICBmaW5kOiAnQCcsXG4gICAgICAgIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKS5yZXBsYWNlKC9cXFxcL2csICcvJylcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGZpbmQ6ICdAbGliJyxcbiAgICAgICAgcmVwbGFjZW1lbnQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9saWInKS5yZXBsYWNlKC9cXFxcL2csICcvJylcbiAgICAgIH1cbiAgICBdXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogdHJ1ZSAgLy8gRW5hYmxlIEhNUiBvdmVybGF5IGZvciBiZXR0ZXIgZGVidWdnaW5nXG4gICAgfVxuICAgIC8vIFJlbW92ZWQgdXNlUG9sbGluZyBhcyBpdCBjYW4gY2F1c2UgaXNzdWVzXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICBleGNsdWRlOiBbJ0BzdXBhYmFzZS9yZWFsdGltZS1qcyddXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IChpZCkgPT4ge1xuICAgICAgICAvLyBPbmx5IGV4dGVybmFsaXplIE5vZGUuanMgbW9kdWxlcyB0aGF0IFN1cGFiYXNlIHJlYWx0aW1lLWpzIG5lZWRzIGJ1dCBjYW4ndCBiZSBwb2x5ZmlsbGVkXG4gICAgICAgIHJldHVybiBbJ3N0cmVhbScsICdodHRwJywgJ2h0dHBzJywgJ3VybCcsICd6bGliJywgJ3V0aWwnLCAnZXZlbnRzJywgJ2Fzc2VydCddLmluY2x1ZGVzKGlkKTtcbiAgICAgIH0sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgIHN1cGFiYXNlOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGNvbW1vbmpzT3B0aW9uczoge1xuICAgICAgaW5jbHVkZTogWy9ub2RlX21vZHVsZXMvXSxcbiAgICAgIGV4dGVuc2lvbnM6IFsnLmpzJywgJy5janMnXSxcbiAgICAgIHN0cmljdFJlcXVpcmVzOiB0cnVlLFxuICAgICAgdHJhbnNmb3JtTWl4ZWRFc01vZHVsZXM6IHRydWVcbiAgICB9XG4gIH0sXG4gIGRlZmluZToge1xuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnXG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUyxTQUFTLG9CQUFvQjtBQUNsVSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBTDlCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLGNBQWM7QUFBQSxNQUNaLE9BQU87QUFBQSxJQUNULENBQUM7QUFBQSxJQUNELGNBQWM7QUFBQTtBQUFBLE1BRVosU0FBUyxDQUFDLFFBQVE7QUFBQTtBQUFBLE1BRWxCLGlCQUFpQjtBQUFBLElBQ25CLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTDtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sYUFBYSxLQUFLLFFBQVEsa0NBQVcsT0FBTyxFQUFFLFFBQVEsT0FBTyxHQUFHO0FBQUEsTUFDbEU7QUFBQSxNQUNBO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhLEtBQUssUUFBUSxrQ0FBVyxXQUFXLEVBQUUsUUFBUSxPQUFPLEdBQUc7QUFBQSxNQUN0RTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUE7QUFBQSxJQUNYO0FBQUE7QUFBQSxFQUVGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLElBQ2xELFNBQVMsQ0FBQyx1QkFBdUI7QUFBQSxFQUNuQztBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDLE9BQU87QUFFaEIsZUFBTyxDQUFDLFVBQVUsUUFBUSxTQUFTLE9BQU8sUUFBUSxRQUFRLFVBQVUsUUFBUSxFQUFFLFNBQVMsRUFBRTtBQUFBLE1BQzNGO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsVUFBVSxDQUFDLHVCQUF1QjtBQUFBLFFBQ3BDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGlCQUFpQjtBQUFBLE1BQ2YsU0FBUyxDQUFDLGNBQWM7QUFBQSxNQUN4QixZQUFZLENBQUMsT0FBTyxNQUFNO0FBQUEsTUFDMUIsZ0JBQWdCO0FBQUEsTUFDaEIseUJBQXlCO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixRQUFRO0FBQUEsRUFDVjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
