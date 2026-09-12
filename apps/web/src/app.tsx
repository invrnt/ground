import { useMemo } from 'react';
import type { DecisionRendererProps } from './copilot/workspace-provider';
import { ProcurementApprovalCard,ProcurementPanel } from './features/procurement';
import { useAgent } from '@copilotkit/react-core/v2';
import { dateSchema,liveStateSchema,type Session } from '@ground/contracts';
import { AuthBoundary } from './features/auth';
import { LiveWorkspace } from './features/workspace';
import { SourcingPanel } from './features/sourcing';
import { PurchasesPanel } from './features/purchases';
import { QueryWidget,ReportView } from './features/reports';
import { RequestsPanel } from './features/requests';
import { OperationsPanel } from './features/operations';
import './styles/global.css';
function ProjectPanels({projectId,csrfToken,costs,admin}:{projectId:string;csrfToken:string;costs:boolean;admin:boolean}) {
 const {agent}=useAgent({agentId:'ground'});const state=liveStateSchema.safeParse(agent.state);
 const reportPath=window.location.pathname.match(/\/reports\/(\d{4}-\d{2}-\d{2})$/)?.[1];const reportDate=dateSchema.safeParse(reportPath);
 return <><QueryWidget projectId={projectId} csrfToken={csrfToken}/><PurchasesPanel projectId={projectId} csrfToken={csrfToken}/>{costs&&<><SourcingPanel projectId={projectId} csrfToken={csrfToken}/><ProcurementPanel projectId={projectId} csrfToken={csrfToken}/><RequestsPanel projectId={projectId} csrfToken={csrfToken}/></>}{admin&&<OperationsPanel projectId={projectId} csrfToken={csrfToken}/>} {state.success&&<p><a href={`/projects/${projectId}/reports/${state.data.snapshot.scenario_date}`}>Open site report</a></p>}{reportDate.success&&<ReportView projectId={projectId} date={reportDate.data}/>}</>;
}
function Workspace({session}:{session:Session}) {const projectId=window.location.pathname.split('/')[2]??session.project_ids[0]??'';const costs=session.user.roles.some(role=>['admin','supervisor','purchasing'].includes(role));const Decision=useMemo(()=>(props:DecisionRendererProps)=><ProcurementApprovalCard {...props} projectId={projectId} csrfToken={session.csrf_token}/>,[projectId,session.csrf_token]);return <LiveWorkspace session={session} slots={{decision:Decision,query:<ProjectPanels projectId={projectId} csrfToken={session.csrf_token} costs={costs} admin={session.user.roles.includes('admin')}/>}}/>;}
export function App(){return <AuthBoundary>{session=><Workspace session={session}/>}</AuthBoundary>;}
