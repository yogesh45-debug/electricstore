import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn, exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'start-flask-backend',
      configureServer(server) {
        // Only run when running Vite development server
        const backendDir = path.resolve(__dirname, '../backend')
        console.log(`[Vite] Starting Flask backend in ${backendDir}...`)

        // Check virtual environments
        let pythonPath = 'python'
        const venvWin = path.join(backendDir, 'venv', 'Scripts', 'python.exe')
        const venvUnix = path.join(backendDir, 'venv', 'bin', 'python')
        const rootVenvWin = path.resolve(backendDir, '../.venv/Scripts/python.exe')
        const rootVenvUnix = path.resolve(backendDir, '../.venv/bin/python')

        if (fs.existsSync(venvWin)) {
          pythonPath = venvWin
        } else if (fs.existsSync(venvUnix)) {
          pythonPath = venvUnix
        } else if (fs.existsSync(rootVenvWin)) {
          pythonPath = rootVenvWin
        } else if (fs.existsSync(rootVenvUnix)) {
          pythonPath = rootVenvUnix
        }

        const flaskProcess = spawn(pythonPath, ['app.py'], {
          cwd: backendDir,
          stdio: 'inherit',
          shell: false
        })

        flaskProcess.on('error', (err) => {
          console.error('[Vite] Failed to start Flask backend:', err)
        })

        server.httpServer?.on('close', () => {
          console.log('[Vite] Stopping Flask backend...')
          if (process.platform === 'win32') {
            exec(`taskkill /pid ${flaskProcess.pid} /f /t`, (err) => {
              if (err) {
                console.error('[Vite] Failed to kill Flask backend process tree:', err)
              }
            })
          } else {
            flaskProcess.kill()
          }
        })
      }
    }
  ],
})
// Triggering reload to start new backend
