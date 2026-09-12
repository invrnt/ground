import { createRoot } from 'react-dom/client';
import { CopilotKitProvider, CopilotChat, useAgent, useCopilotKit, useHumanInTheLoop } from '@copilotkit/react-core/v2';
import { HttpAgent } from '@ag-ui/client';
import { z } from 'zod';
const agent=new HttpAgent({url:'http://127.0.0.1:4311/agent',agentId:'default',threadId:'foundation-demo'});
function Probe() {
 const {agent:current}=useAgent();
 const {copilotkit}=useCopilotKit();
 useHumanInTheLoop({name:'confirm_probe',description:'Confirm the isolated compatibility checkpoint',parameters:z.object({checkpoint_id:z.string()}),render:({status,respond})=>respond?<button onClick={()=>respond({confirmed:true})}>Confirm sample checkpoint</button>:<p>{status}</p>});
 return <main><h1>Ground SDK compatibility probe</h1><p>Demo only. No procurement or provider send.</p><button onClick={()=>void copilotkit.runAgent({agent:current})}>Load stored checkpoint</button><pre>{JSON.stringify(current.state)}</pre><CopilotChat agentId="default" /></main>;
}
const root=document.getElementById('root');if(!root)throw new Error('Missing root');
createRoot(root).render(<CopilotKitProvider agents__unsafe_dev_only={{default:agent}}><Probe/></CopilotKitProvider>);
