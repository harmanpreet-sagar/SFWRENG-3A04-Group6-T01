/**
 * Root Application Component
 * Main entry point for the Threshold Management System frontend
 *
 * Simple explanation (alerts): The real screen for viewing and managing alerts will
 * live under this app once routing is built; for now this file is the frontend’s front door.
 *
 * This component will eventually include:
 * - Routing for different pages (Dashboard, Threshold Admin, Alerts)
 * - Authentication context and protected routes
 * - MQTT connection for real-time telemetry updates
 */

import { useState } from 'react'

function App() {
  return (
    <div className="App">
      <h1>Threshold Management System</h1>
      <p>Group 6 - Tutorial 01</p>
    </div>
  )
}

export default App
