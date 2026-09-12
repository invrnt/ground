import type { ActorContext, ApprovalDecision, ApprovalDecisionInput, Clarification, DomainEvent, ExecutionEnvelope, ExternalObjectLink, InterpretationResult, Job, NormalizedMessage, OperationResult, OutboundRequest, ProcurementNeed, ProjectSnapshot, ReportSnapshot, SupplierCandidate } from './index';
export interface TransactionContext { readonly transaction_id: string; }
export interface TransactionRunner { run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>; }
export interface ProjectRepository { snapshot(context: ActorContext, tx?: TransactionContext): Promise<ProjectSnapshot>; }
export interface PrivateFileStore { put(input: { id: string; bytes: Uint8Array; content_type: string; sha256: string }): Promise<void>; read(id: string): Promise<Uint8Array>; remove(id: string): Promise<void>; }
export interface JobQueue { enqueue(job: Job, tx: TransactionContext): Promise<void>; }
export interface InventoryService { consume(input: ExecutionEnvelope, tx: TransactionContext): Promise<OperationResult>; }
export interface SiteCommandService { execute(input: ExecutionEnvelope, tx?: TransactionContext): Promise<OperationResult>; }
export interface InterpretationService { interpret(message: NormalizedMessage, context: ActorContext): Promise<InterpretationResult>; }
export interface ClarificationService { request(input: Clarification, tx: TransactionContext): Promise<Clarification>; answer(context: ActorContext, id: string, token: string, answer: string): Promise<OperationResult>; }
export interface ResearchService { research(context: ActorContext, need: ProcurementNeed): Promise<SupplierCandidate[]>; }
export interface ReportService { snapshot(context: ActorContext, date: string, tx?: TransactionContext): Promise<ReportSnapshot>; }
export interface ApprovalService { decide(context: ActorContext, input: ApprovalDecisionInput): Promise<ApprovalDecision>; }
export interface DispatchService { dispatch(context: ActorContext, proposal_id: string, version: number): Promise<OutboundRequest>; }
export interface WorkspaceSyncService { sync(context: ActorContext, job: Job): Promise<ExternalObjectLink>; }
export interface LiveStateService { snapshot(context: ActorContext): Promise<ProjectSnapshot>; events(context: ActorContext, after: number): AsyncIterable<DomainEvent>; }
export interface TelegramAdapter { getFile(file_id: string): Promise<{ bytes: Uint8Array; content_type: string }>; send(input: { recipient_id: string; text: string; reply_to_message_id?: string }): Promise<{ message_id: string }>; }
export interface ReportInterpretationAdapter { transcribe(input: { bytes: Uint8Array; filename: string }): Promise<{ text: string; model: string }>; interpret(input: { message: NormalizedMessage; context: ProjectSnapshot }): Promise<InterpretationResult>; }
export interface ExaAdapter { search(query: string): Promise<{ id: string; url: string; title: string | null }[]>; contents(urls: string[]): Promise<{ url: string; text: string; fetched_at: string }[]>; }
export interface RemoteObject { id: string; url: string; revision: string | null; }
export interface AmbiguousAdapter {
 checkCapabilities(): Promise<{ upload_read: boolean; task_assignment_due_date: boolean; document_read_update: boolean; reconciliation: boolean }>;
 uploadEvidence(input: { bytes: Uint8Array; filename: string; content_type: string; sha256: string; marker: string }): Promise<RemoteObject>;
 getFile(id: string): Promise<RemoteObject>;
 createTask(input: { title: string; description: string; assignee_id: string; due_at: string; evidence_url: string; marker: string }): Promise<RemoteObject>;
 updateTask(id: string, input: { desired_version: number; status?: string; due_at?: string; assignee_id?: string }): Promise<RemoteObject>;
 getTask(id: string): Promise<RemoteObject & { title: string; assignee_id: string; due_at: string; evidence_url: string }>;
 createDocument(input: { title: string; content: string; marker: string }): Promise<RemoteObject>;
 updateDocument(id: string, input: { observed_revision: string | null; content: string }): Promise<RemoteObject>;
 getDocument(id: string): Promise<RemoteObject & { content: string }>;
 findByMarker(kind: 'file' | 'task' | 'document', marker: string): Promise<{ status: 'unique' | 'none' | 'ambiguous' | 'unsupported'; object: RemoteObject | null }>;
}
export interface InventoryReceiptInput { context:ActorContext; material_id:string; quantity:string; unit:string; receipt_line_id:string; idempotency_key:string; evidence_ids:string[]; expected_version:number; }
export interface InventoryReceiptService extends InventoryService { receive(input:InventoryReceiptInput,tx?:TransactionContext):Promise<OperationResult>; }

export interface CoalescingJobQueue extends JobQueue { enqueueLatest(job:Job,tx:TransactionContext):Promise<void>; }

export interface ChannelBinding { project_id: string; run_id: string; }
export interface IncomingUpdate { update_id: string; chat_id: string; sender_id: string; sent_at: string; message_id: string; callback: { id: string; data: string } | null; raw: unknown; }
export interface ConfirmedSend { message_id: string; chat_id: string; sent_at: string; }
/**
 * Driven port for a conversational channel. The ingestion and dispatch modules depend on
 * this interface only, so a channel is swapped at the composition root. BotTelegramAdapter
 * and SlackChannelAdapter both implement it.
 */
export interface ChannelAdapter {
 readonly provider: NormalizedMessage['provider'];
 verifyWebhook(secret: unknown): void;
 inspectUpdate(raw: unknown): IncomingUpdate;
 normalizeUpdate(raw: unknown, binding: ChannelBinding, received_at?: string): NormalizedMessage;
 intakeError(raw: unknown): string | null;
 downloadFile(file_id: string): Promise<{ bytes: Uint8Array; content_type: string; sha256: string }>;
 sendMessage(input: { recipient_id: string; text: string; reply_to_message_id?: string }): Promise<ConfirmedSend>;
 answerCallback(callback_query_id: string, text: string): Promise<void>;
}
