import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { ipaddress } from "@revolution-game/common"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { host: ipaddress, port: 3000 },
  optimizeDeps: {
    include: ["@revolution-game/common"]
  }
})
