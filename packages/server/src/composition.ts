import { notReady, toolNames, type ActorContext, type ToolName, type Job, type SiteCommandService, type TransactionContext, type ExternalObjectLink } from '@ground/contracts';
import { createPool, PgTransactions, PgJobQueue, LocalPrivateFiles, Sessions } from './infra';
import { projectModule, PgProjectRepository } from './modules/project';
import { BotTelegramAdapter } from './adapters/telegram';
import { SlackChannelAdapter } from './adapters/slack';
import type { ChannelAdapter } from '@ground/contracts';
import { IngestionService, PgIngestionRepository, ingestionModule } from './modules/ingestion';
import { SiteService, siteModule, type ProposalInvalidation } from './modules/site';
import { InterpretationWorkflow, InterpretationRepository, interpretationModule } from './modules/interpretation';
import { OpenAIReportAdapter } from './adapters/openai';
import { LiveService, liveModule } from './modules/live';
import { ExaClient } from './adapters/exa';
import { SourcingService, sourcingModule } from './modules/sourcing';
import { PurchaseService, purchaseModule } from './modules/purchases';
import { ReportingService, reportingModule, purchaseReportSections } from './modules/reporting';
import { ProcurementService, procurementModule } from './modules/procurement';
import { AmbiguousClient } from './adapters/ambiguous';
import { OfficeRepository, OfficeSyncService, workspaceSyncModule } from './modules/workspace-sync';
import { DispatchService, dispatchModule } from './modules/dispatch';
import { OperationsService, operationsModule } from './modules/operations';
import type { FastifyInstance } from 'fastify';
export interface ServerModule { name: string; poll?:()=>Promise<void>; registerRoutes?: (app: FastifyInstance) => Promise<void>; jobs?: Partial<Record<Job['kind'], (job: Job) => Promise<void>>>; }
export interface Composition { runtime?: ReturnType<typeof createRuntime>; modules: readonly ServerModule[]; invoke: (name: ToolName, context: ActorContext, input: unknown) => Promise<unknown>; }
export function createRuntime(options?:{invalidation?:ProposalInvalidation;links?:(context:ActorContext,tx:TransactionContext)=>Promise<ExternalObjectLink[]>}) {
 const pool=createPool();
 const transactions=new PgTransactions(pool);
 const queue=new PgJobQueue(transactions);
 const files=new LocalPrivateFiles(process.env['PRIVATE_STORAGE_PATH']||'/tmp/ground-private');
 const sessions=new Sessions(pool,process.env['PUBLIC_BASE_URL']||'http://localhost:3000');
 const projects=new PgProjectRepository(transactions,options?.links?{links:options.links}:undefined);
 const site=new SiteService({transactions,queue,...(options?.invalidation?{invalidation:options.invalidation}:{})});
 return {pool,transactions,queue,files,sessions,projects,site};
}
export function createComposition(): Composition {
 let procurement:ProcurementService|undefined;let officeRepository:OfficeRepository|undefined;let dispatch:DispatchService|undefined;
 const runtime=createRuntime({invalidation:{changed:(input,tx)=>procurement?procurement.changed(input,tx):Promise.resolve()},links:(context,tx)=>officeRepository?officeRepository.links(context,tx):Promise.resolve([])});
 officeRepository=new OfficeRepository(runtime.transactions);
 const officeLinks=officeRepository;
 const modules:ServerModule[]=[projectModule(runtime.pool,runtime.sessions,runtime.files),siteModule(runtime.site,runtime.sessions)];
 const sourcing=new SourcingService({transactions:runtime.transactions,projects:runtime.projects,queue:runtime.queue,adapter:new ExaClient(process.env['EXA_API_KEY']??'')});
 const purchases=new PurchaseService({transactions:runtime.transactions,inventory:runtime.site});
 const reporting=new ReportingService({transactions:runtime.transactions,projects:runtime.projects,queue:runtime.queue,supplements:{followup:async(context,tx)=>dispatch?dispatch.reportSections(context,tx):[],links:(context,tx)=>officeLinks.links(context,tx),sources:(context,tx)=>sourcing.sourcesForRun(context,tx),purchases:async(context,tx)=>purchaseReportSections(await purchases.list(context,tx))}});
 const commands:SiteCommandService={execute:(input,tx)=>['register_purchase','confirm_receipt'].includes(input.proposal.type)?purchases.execute(input,tx):runtime.site.execute(input,tx)};
 modules.push(sourcingModule(sourcing,runtime.sessions),purchaseModule(purchases,runtime.sessions),reportingModule(reporting,runtime.sessions));
 const officeToken=process.env['AMBIGUOUS_API_TOKEN'],officeWorkspace=process.env['AMBIGUOUS_WORKSPACE_ID'],officeBase=process.env['AMBIGUOUS_BASE_URL'];
 if(officeToken&&officeWorkspace){const office=new OfficeSyncService({repository:officeLinks,adapter:new AmbiguousClient({token:officeToken,workspace_id:officeWorkspace,...(officeBase?{base_url:officeBase}:{})}),files:runtime.files,queue:runtime.queue,public_base_url:runtime.sessions.origin});modules.push(workspaceSyncModule(office));}else modules.push({name:'office_configuration_pending'});
 let workflow:InterpretationWorkflow|undefined;
 const channel=selectChannel();
 if(channel) {
  const {adapter,bot_id:botId,provider}=channel;
  const repository=new PgIngestionRepository(tx=>runtime.transactions.client(tx));
  const service=new IngestionService({bot_id:botId,adapter,repository,transactions:runtime.transactions,queue:runtime.queue,files:runtime.files,router:{route:(input,actor,tx)=>workflow?workflow.route(input,actor,tx):Promise.resolve(false)}});
  const delivery=new DispatchService({transactions:runtime.transactions,queue:runtime.queue,authorization:{authorizedDispatch:(context,id,version,tx)=>procurement?procurement.authorizedDispatch(context,id,version,tx):Promise.reject(new Error('Procurement is not registered'))},adapter,bot_id:botId,files:runtime.files,public_base_url:runtime.sessions.origin});
  dispatch=delivery;
  modules.push({...ingestionModule(service),registerRoutes:async app=>{if(provider==='telegram')registerTelegramWebhook(app,delivery,service);else await registerSlackWebhook(app,delivery,service);}},dispatchModule(delivery,runtime.sessions));
  const apiKey=process.env['OPENAI_API_KEY'],transcriptionModel=process.env['OPENAI_TRANSCRIPTION_MODEL'],interpretationModel=process.env['OPENAI_INTERPRETATION_MODEL'];
  if(apiKey&&transcriptionModel&&interpretationModel) {
   const ffmpegPath=process.env['FFMPEG_PATH'];
   const openai=new OpenAIReportAdapter({api_key:apiKey,transcription_model:transcriptionModel,interpretation_model:interpretationModel,...(ffmpegPath?{ffmpeg_path:ffmpegPath}:{})},runtime.files);
   workflow=new InterpretationWorkflow({transactions:runtime.transactions,repository:new InterpretationRepository(runtime.transactions),intake:repository,replies:service,projects:runtime.projects,commands,purchases,queries:reporting,queue:runtime.queue,files:runtime.files,adapter:openai});
   modules.push(interpretationModule(workflow,runtime.sessions));
  }

 } else {
  modules.push({name:'channel_configuration_pending',registerRoutes:async app=> { app.post('/webhooks/telegram',async()=>notReady('Telegram configuration')); app.post('/webhooks/slack',async()=>notReady('Slack configuration')); }});
 }
 if(!workflow)modules.push({name:'interpretation_configuration_pending'});
 if(!dispatch)modules.push({name:'dispatch_configuration_pending'});
 modules.push(operationsModule(new OperationsService({transactions:runtime.transactions,queue:runtime.queue}),runtime.sessions));
 const activeWorkflow=workflow;
 const live=new LiveService(runtime.transactions,runtime.projects,{history:(context,id,tx)=>runtime.site.history(context,id,tx),...(activeWorkflow?{transcript:(context:ActorContext,id:string,tx:import('@ground/contracts').TransactionContext)=>activeWorkflow.transcriptForInput(context,id,tx)}:{})});
 procurement=new ProcurementService({transactions:runtime.transactions,projects:runtime.projects,queue:runtime.queue,sourcing,checkpoints:live,secret:process.env['SESSION_SECRET']??''});
 const decisions=procurement;
 modules.push(procurementModule(decisions,runtime.sessions),liveModule(live,runtime.sessions,{arguments:(context,checkpoint)=>decisions.arguments(context,checkpoint),decide:(context,_checkpoint,input)=>decisions.decide(context,input)}));
 return {runtime,modules,invoke:async(name,context)=> {
  if(name==='get_project_context')return runtime.projects.snapshot(context);
  if(name==='get_inventory')return (await runtime.projects.snapshot(context)).stock;
  if(name==='get_work_plan')return (await runtime.projects.snapshot(context)).work;
  if(name==='list_open_issues')return (await runtime.projects.snapshot(context)).issues.filter(issue=>issue.fields['status']!=='resolved');
  return notReady(name);
 }};
}
export const unavailableTools = toolNames.filter(name=>!['get_project_context','get_inventory','get_work_plan','list_open_issues'].includes(name));

/** Which channel adapter the composition root binds to the ingestion and dispatch ports. */
interface SelectedChannel { adapter: ChannelAdapter; bot_id: string; provider: 'telegram' | 'slack' }

/**
 * GROUND_CHANNEL picks the channel explicitly. With nothing set, Telegram wins when it is
 * configured so existing deployments keep their behaviour, and Slack is used otherwise.
 */
function selectChannel(): SelectedChannel | null {
 const preferred = process.env['GROUND_CHANNEL'];
 const telegramToken = process.env['TELEGRAM_BOT_TOKEN'], telegramSecret = process.env['TELEGRAM_WEBHOOK_SECRET'];
 const telegramBotId = telegramToken?.split(':')[0];
 const telegram = telegramToken && telegramSecret && telegramBotId && /^\d+$/.test(telegramBotId)
  ? { adapter: new BotTelegramAdapter({ token: telegramToken, webhook_secret: telegramSecret }), bot_id: telegramBotId, provider: 'telegram' as const }
  : null;
 const slackToken = process.env['SLACK_BOT_TOKEN'], slackSecret = process.env['SLACK_SIGNING_SECRET'], slackBotId = process.env['SLACK_BOT_USER_ID'];
 const slack = slackToken && slackSecret && slackBotId
  ? { adapter: new SlackChannelAdapter({ token: slackToken, signing_secret: slackSecret }), bot_id: slackBotId, provider: 'slack' as const }
  : null;
 if (preferred === 'telegram') return telegram;
 if (preferred === 'slack') return slack;
 return telegram ?? slack;
}

function registerTelegramWebhook(app: FastifyInstance, delivery: DispatchService, service: IngestionService): void {
 app.post('/webhooks/telegram', { bodyLimit: 1024 * 1024 }, async request => delivery.webhook(request.headers['x-telegram-bot-api-secret-token'], request.body, async () => {
  const input = await service.accept(request.headers['x-telegram-bot-api-secret-token'], request.body);
  return { accepted: true, input_id: input.id };
 }));
}

/**
 * Slack signs the exact bytes it sent, so this route is registered inside its own plugin
 * scope with a parser that keeps the raw body. The encapsulation stops that parser from
 * applying to the rest of the API.
 */
async function registerSlackWebhook(app: FastifyInstance, delivery: DispatchService, service: IngestionService): Promise<void> {
 await app.register(async scoped => {
  scoped.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, payload, done) => {
   try { done(null, { raw: payload as string, parsed: JSON.parse(payload as string) as unknown }); } catch { done(new Error('Invalid JSON'), undefined); }
  });
  scoped.post('/webhooks/slack', { bodyLimit: 1024 * 1024 }, async (request, reply) => {
   const body = request.body as { raw: string; parsed: unknown };
   const envelope = body.parsed as { type?: string; challenge?: string };
   /** Slack verifies a new Request URL by asking the endpoint to echo a challenge. */
   if (envelope?.type === 'url_verification' && typeof envelope.challenge === 'string') return reply.send({ challenge: envelope.challenge });
   const secret = { signature: String(request.headers['x-slack-signature'] ?? ''), timestamp: String(request.headers['x-slack-request-timestamp'] ?? ''), body: body.raw };
   return delivery.webhook(secret, body.parsed, async () => {
    const input = await service.accept(secret, body.parsed);
    return { accepted: true, input_id: input.id };
   });
  });
 });
}
