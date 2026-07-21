import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { connect } from 'node:net'
import { join } from 'node:path'

const clientDirectory = process.cwd()
const projectDirectory = join(clientDirectory, '..')
const serverDirectory = join(projectDirectory, 'Server')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const apiPort = 3021

const isPortOpen = (port) => new Promise((resolve) => {
  const socket = connect({ host: '127.0.0.1', port })
  socket.once('connect', () => {
    socket.end()
    resolve(true)
  })
  socket.once('error', () => resolve(false))
})

const apiIsRunning = await isPortOpen(apiPort)
if (apiIsRunning) console.log(`[API] Reusing the server already running on port ${apiPort}.`)

const applications = [
  ...(apiIsRunning ? [] : [{ name: 'API', directory: serverDirectory, port: apiPort, command: ['run', 'dev'] }]),
  { name: 'Launcher', directory: '.', port: 5172, command: ['run', 'dev:launcher'] },
  { name: 'Coordinator', directory: 'src/coordinator', port: 5173, command: ['run', 'dev'] },
  { name: 'Student', directory: 'src/student', port: 5174, command: ['run', 'dev'] },
  { name: 'Supervisor', directory: 'src/supervisor', port: 5175, command: ['run', 'dev'] },
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

  const child = spawn(npmCommand, application.command, { cwd: directory, stdio: 'inherit' })
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
