import { AuthBoundary } from './features/auth';
import { LiveWorkspace } from './features/workspace';
import './styles/global.css';
export function App() { return <AuthBoundary>{session=><LiveWorkspace session={session}/>}</AuthBoundary>; }
