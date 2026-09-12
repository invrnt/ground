import { useAgent } from '@copilotkit/react-core/v2';
import { dateSchema,liveStateSchema,type Session } from '@ground/contracts';
import { AuthBoundary } from './features/auth';
import { LiveWorkspace } from './features/workspace';
import { SourcingPanel } from './features/sourcing';
import { PurchasesPanel } from './features/purchases';
import { QueryWidget,ReportView } from './features/reports';
import './styles/global.css';
function ProjectPanels({projectId,csrfToken}:{projectId:string;csrfToken:string}) {
 const {agent}=useAgent({agentId:'ground'});const state=liveStateSchema.safeParse(agent.state);
 const reportPath=window.location.pathname.match(/\/reports\/(\d{4}-\d{2}-\d{2})$/)?.[1];const reportDate=dateSchema.safeParse(reportPath);
 return <><QueryWidget projectId={projectId} csrfToken={csrfToken}/><PurchasesPanel projectId={projectId} csrfToken={csrfToken}/>{state.success&&<p><a href={`/projects/${projectId}/reports/${state.data.snapshot.scenario_date}`}>Open site report</a></p>}{reportDate.success&&<ReportView projectId={projectId} date={reportDate.data}/>}</>;
}
function Workspace({session}:{session:Session}) {const projectId=window.location.pathname.split('/')[2]??session.project_ids[0]??'';const costs=session.user.roles.some(role=>['admin','supervisor','purchasing'].includes(role));return <LiveWorkspace session={session} slots={{query:<ProjectPanels projectId={projectId} csrfToken={session.csrf_token}/>,...(costs?{supplierTools:<SourcingPanel projectId={projectId} csrfToken={session.csrf_token}/>}:{})}}/>;}
export function App(){return <AuthBoundary>{session=><Workspace session={session}/>}</AuthBoundary>;}
