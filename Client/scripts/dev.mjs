import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { connect } from 'node:net'
import { join } from 'node:path'
import { config as loadDotenv } from 'dotenv'

const clientDirectory = process.cwd()
const projectDirectory = join(clientDirectory, '..')
const serverDirectory = join(projectDirectory, 'Server')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
loadDotenv({ path: join(clientDirectory, '.env') })

const apiServerUrl = new URL(process.env.API_SERVER_URL || 'http://127.0.0.1:5000')
const apiPort = Number(apiServerUrl.port || (apiServerUrl.protocol === 'https:' ? 443 : 80))
const clientPort = Number(process.env.CLIENT_PORT || 5172)
const localApiHosts = new Set(['127.0.0.1', 'localhost', '::1'])
const useLocalApi = localApiHosts.has(apiServerUrl.hostname)

const isPortOpen = (port) => new Promise((resolve) => {
  const socket = connect({ host: '127.0.0.1', port })
  socket.once('connect', () => {
    socket.end()
    resolve(true)
  })
  socket.once('error', () => resolve(false))
})

const apiIsRunning = useLocalApi && await isPortOpen(apiPort)
if (useLocalApi && apiIsRunning) {
  console.log(`[API] Reusing the server already running on port ${apiPort}.`)
}
if (!useLocalApi) {
  console.log(`[API] Using remote API at ${apiServerUrl.origin}.`)
}

const applications = [
  ...(useLocalApi && !apiIsRunning ? [{
    name: 'API',
    directory: serverDirectory,
    port: apiPort,
    command: ['run', 'dev'],
    env: { PORT: String(apiPort) },
  }] : []),
  { name: 'SPMS', directory: '.', port: clientPort, command: ['run', 'dev:launcher'] },
]

const children = []
let stopping = false

for (const application of applications) {
  if (await isPortOpen(application.port)) {
    console.log(`[${application.name}] Reusing the server already running on port ${application.port}.`)
    continue
  }

  const directory = application.directory === serverDirectory
    ? serverDirectory
    : join(clientDirectory, application.directory)
  if (!existsSync(join(directory, 'node_modules'))) {
    console.error(`[${application.name}] Dependencies are missing. Run: npm install --prefix ${application.directory}`)
    process.exitCode = 1
    continue
  }

  const child = spawn(npmCommand, application.command, {
    cwd: directory,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...application.env },
  })
  children.push(child)
  child.on('exit', (code) => { if (code && !stopping) process.exitCode = code })
}

const stop = () => {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
