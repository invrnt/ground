import { HttpAgent } from '@ag-ui/client';
const agent=new HttpAgent({url:'http://127.0.0.1:4311/agent',threadId:'foundation-demo'});
await agent.runAgent();
console.info({phase:'server_state_received',state:agent.state,messages:agent.messages.length});
