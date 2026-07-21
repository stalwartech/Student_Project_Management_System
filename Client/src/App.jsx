import './App.css'

function App() {
  return (
    <main className="launcher">
      <p className="eyebrow">Student Project Management System</p>
      <h1>Choose a workspace</h1>
      <p className="intro">All three portals start together when you run <code>npm run dev</code> in the Client directory.</p>
      <section className="portals" aria-label="Available portals">
        <a className="portal" href="http://localhost:5173">
          <span className="portal-role">Coordinator</span>
          <span>Manage projects, students, supervisors, reports, and allocation.</span>
          <strong>Open coordinator portal →</strong>
        </a>
        <a className="portal" href="http://localhost:5174">
          <span className="portal-role">Student</span>
          <span>View your project, milestones, messages, and submissions.</span>
          <strong>Open student portal →</strong>
        </a>
        <a className="portal" href="http://localhost:5175">
          <span className="portal-role">Supervisor</span>
          <span>Review students, projects, feedback, and progress.</span>
          <strong>Open supervisor portal →</strong>
        </a>
      </section>
    </main>
  )
}

export default App
