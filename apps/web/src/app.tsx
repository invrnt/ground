import { AuthBoundary, SignOutButton } from './features/auth';
import { Card, WorkspaceShell } from './ui';
import './styles/global.css';
export function App() {
 return <AuthBoundary>{session=><WorkspaceShell projectName="La Arboleda" runLabel="Demo workspace" connection="connected" account={<SignOutButton csrfToken={session.csrf_token}/> }>
  <Card title={`Welcome, ${session.user.display_name}`}><p>Your project session is active.</p><p>Project reports, evidence and supplier decisions will appear here as the remaining modules are connected.</p></Card>
 </WorkspaceShell>}</AuthBoundary>;
}
