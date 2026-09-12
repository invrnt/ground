import type {ServerModule} from '../../composition';
import type {OfficeSyncService} from './workspace-sync-service';
export * from './office-repository';
export * from './sync-coordinator';
export * from './workspace-sync-service';
export function workspaceSyncModule(service:OfficeSyncService):ServerModule{return {name:'workspace-sync',jobs:{sync_attachment:job=>service.handle(job),sync_assignment:job=>service.handle(job),sync_report:job=>service.handle(job)}};}
