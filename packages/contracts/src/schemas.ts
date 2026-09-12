import { z } from 'zod';
export const idSchema = z.string().uuid();
export const decimalSchema = z.string().regex(/^-?\d+(\.\d+)?$/);
export const dateSchema = z.string().date();
export const timestampSchema = z.string().datetime();
export const roleSchema = z.enum(['admin', 'supervisor', 'purchasing', 'worker', 'assignee']);
export const actorContextSchema = z.object({ actor_id: idSchema, project_id: idSchema, run_id: idSchema, roles: z.array(roleSchema), permissions: z.array(z.string()), trusted_time: timestampSchema }).strict();
export type ActorContext = z.infer<typeof actorContextSchema>;
export type Decimal = z.infer<typeof decimalSchema>;
export const errorCodeSchema = z.enum(['NOT_READY','UNAUTHORIZED','FORBIDDEN','NOT_FOUND','VALIDATION_ERROR','CONFLICT','EXPIRED','PROVIDER_UNAVAILABLE','UNCERTAIN','INTERNAL_ERROR']);
export const apiErrorSchema = z.object({ code: errorCodeSchema, message: z.string(), retryable: z.boolean(), request_id: z.string().optional() }).strict();
export type ApiError = z.infer<typeof apiErrorSchema>;
export class GroundError extends Error { constructor(public readonly code: ApiError['code'], message: string, public readonly retryable = false) { super(message); this.name = 'GroundError'; } }
export const notReady = (module: string): never => { throw new GroundError('NOT_READY', `${module} is not ready`); };
const fieldsSchema = z.record(z.union([z.string(),z.number(),z.boolean(),z.null(),z.array(z.string())]));
const common = { evidence_ids: z.array(idSchema), expected_version: z.number().int().nonnegative() };
const command = <T extends string, E extends z.ZodRawShape, F extends z.ZodRawShape>(type:T, entity_ids:E, fields:F) => z.object({ type:z.literal(type), entity_ids:z.object(entity_ids).strict(), fields:z.object(fields).strict(), ...common }).strict();
const positive = decimalSchema.refine(v => !v.startsWith('-') && /[1-9]/.test(v), 'Must be positive');
const purchaseLine = z.object({ material_id:idSchema, quantity:positive, unit:z.string(), unit_price:decimalSchema.nullable() }).strict();
export const operationProposalSchema = z.discriminatedUnion('type', [
 command('complete_work_item',{work_item_id:idSchema},{}),
 command('consume_material',{material_id:idSchema,location_id:idSchema},{quantity:positive,unit:z.string()}),
 command('report_issue',{location_id:idSchema},{description:z.string().min(1),observed_condition:z.string().min(1)}),
 command('assign_review',{issue_id:idSchema,assignee_id:idSchema,blocking_work_item_id:idSchema},{due_at:timestampSchema}),
 command('update_assignment',{assignment_id:idSchema},{status:z.enum(['pending','in_progress','completed','cancelled']).optional(),due_at:timestampSchema.optional()}),
 command('resolve_issue',{issue_id:idSchema},{resolution_note:z.string().min(1)}),
 command('correct_operation',{original_operation_id:idSchema},{quantity:positive.optional(),field:z.string().optional(),value:z.string().optional(),reason:z.string().min(1)}),
 command('register_purchase',{}, {invoice_date:dateSchema.optional(),issuer:z.string().nullable(),reference:z.string().nullable(),lines:z.array(purchaseLine).min(1),currency:z.literal('COP'),document_hash:z.string().min(1)}),
 command('confirm_receipt',{purchase_id:idSchema},{lines:z.array(z.object({line_id:idSchema,quantity:positive}).strict()).min(1)})
]);
export type OperationProposal = z.infer<typeof operationProposalSchema>;
export const operationResultSchema=z.object({operation_id:idSchema,status:z.enum(['applied','already_applied','needs_input','rejected','conflict']),event_ids:z.array(idSchema),state_diff:z.array(z.object({entity_type:z.string(),entity_id:idSchema,before:fieldsSchema,after:fieldsSchema}).strict()),pending_actions:z.array(z.object({id:idSchema,kind:z.string(),status:z.string(),route:z.string().startsWith('/')}).strict()),project_version:z.number().int(),evidence_ids:z.array(idSchema)}).strict();
export type OperationResult=z.infer<typeof operationResultSchema>;
export interface ExecutionEnvelope { context: ActorContext; proposal: OperationProposal; source_message_id: string; idempotency_key: string; }
export const toolNames = ['get_project_context','get_inventory','get_work_plan','list_open_issues','get_evidence','propose_operation','request_clarification','prepare_procurement_request','apply_validated_operation','correct_operation','generate_site_report','search_supplier_pages','extract_supplier_candidate','enqueue_workspace_sync','request_approval','dispatch_approved_request','schedule_followup'] as const;
export type ToolName = typeof toolNames[number];
export const mediaDescriptorSchema=z.object({id:idSchema,provider_file_id:z.string(),mime_type:z.string(),filename:z.string().nullable(),size_bytes:z.number().int().nonnegative().nullable(),kind:z.enum(['audio','photo','document']),sha256:z.string().nullable()}).strict();
export const normalizedMessageSchema=z.object({provider:z.literal('telegram'),update_id:z.string(),chat_id:z.string(),message_id:z.string(),sender_id:z.string(),text:z.string().nullable(),sent_at:timestampSchema,received_at:timestampSchema,reply_to_message_id:z.string().nullable(),media:z.array(mediaDescriptorSchema),project_id:idSchema,run_id:idSchema}).strict();
export type NormalizedMessage=z.infer<typeof normalizedMessageSchema>;
export const interpretationResultSchema=z.object({transcript_reference:idSchema.nullable(),operations:z.array(operationProposalSchema),missing_fields:z.array(z.string()),query_intent:z.string().nullable(),irrelevant:z.boolean(),model_version:z.string(),schema_version:z.number().int()}).strict();
export type InterpretationResult=z.infer<typeof interpretationResultSchema>;
export const clarificationSchema=z.object({id:idSchema,pending_operation_ids:z.array(idSchema),report_id:idSchema,thread_id:z.string(),question:z.string(),options:z.array(z.string()),allowed_respondent_ids:z.array(idSchema),expected_version:z.number().int(),expires_at:timestampSchema,token_hash:z.string(),answer:z.string().nullable(),result:operationResultSchema.nullable()}).strict();
export type Clarification=z.infer<typeof clarificationSchema>;
export const procurementNeedSchema=z.object({id:idSchema,material_id:idSchema,activity_id:idSchema,required_date:dateSchema,area:decimalSchema,allowance:decimalSchema,usable_stock:decimalSchema,committed_stock:decimalSchema,net_quantity:decimalSchema,version:z.number().int(),evidence_ids:z.array(idSchema)}).strict();
export type ProcurementNeed=z.infer<typeof procurementNeedSchema>;
export const supplierCandidateSchema=z.object({id:idSchema,query_id:idSchema,source_url:z.string().url(),fetched_at:timestampSchema,merchant:z.string().nullable(),product:z.string().nullable(),reference:z.string().nullable(),specification:z.string().nullable(),compatibility_status:z.enum(['compatible','incompatible','needs_review','unknown']),sale_unit:z.string().nullable(),coverage:decimalSchema.nullable(),published_price:decimalSchema.nullable(),currency:z.string().nullable(),delivery_statement:z.string().nullable(),evidence_by_field:z.record(z.object({source_snapshot_id:idSchema,excerpt:z.string()}).strict())}).strict();
export type SupplierCandidate=z.infer<typeof supplierCandidateSchema>;
export const candidateCalculationSchema=z.object({candidate_id:idSchema,candidate_version:z.number().int(),need_id:idSchema,need_version:z.number().int(),required_boxes:z.number().int().nonnegative(),unit_price_basis:z.string().nullable(),converted_price:decimalSchema.nullable(),material_subtotal:decimalSchema.nullable(),known_transport:decimalSchema.nullable(),known_tax:decimalSchema.nullable(),known_total:decimalSchema.nullable(),unresolved_fields:z.array(z.string()),formula:z.string(),inputs:fieldsSchema}).strict();
export type CandidateCalculation=z.infer<typeof candidateCalculationSchema>;
export const requestProposalSchema=z.object({id:idSchema,version:z.number().int(),need_id:idSchema,need_version:z.number().int(),candidate_id:idSchema,candidate_version:z.number().int(),selected_specification:z.string(),calculation:candidateCalculationSchema,recipient_id:z.string(),address:z.string(),desired_date:dateSchema,exact_text:z.string(),content_hash:z.string(),status:z.enum(['draft','pending','approved','rejected','invalidated','expired']),expires_at:timestampSchema,checkpoint_id:idSchema}).strict();
export type RequestProposal=z.infer<typeof requestProposalSchema>;
export const approvalDecisionInputSchema=z.object({proposal_id:idSchema,proposal_version:z.number().int(),decision:z.enum(['approve','reject']),checkpoint_token:z.string().min(1)}).strict();
export type ApprovalDecisionInput=z.infer<typeof approvalDecisionInputSchema>;
export const approvalDecisionSchema=approvalDecisionInputSchema.omit({checkpoint_token:true}).extend({id:idSchema,actor_id:idSchema,decided_at:timestampSchema,content_hash:z.string(),recipient_id:z.string(),run_id:idSchema}).strict();
export type ApprovalDecision=z.infer<typeof approvalDecisionSchema>;
export const outboundRequestSchema=z.object({id:idSchema,proposal_id:idSchema,proposal_version:z.number().int(),approval_id:idSchema,payload:z.string(),recipient_id:z.string(),status:z.enum(['pending','sending','sent','uncertain','failed','cancelled']),provider_message_id:z.string().nullable(),attempted_at:timestampSchema.nullable(),uncertain_at:timestampSchema.nullable()}).strict();
export type OutboundRequest=z.infer<typeof outboundRequestSchema>;
export const externalObjectLinkSchema=z.object({provider:z.literal('ambiguous'),local_id:idSchema,object_kind:z.enum(['file','task','document']),project_id:idSchema,run_id:idSchema,remote_id:z.string(),remote_url:z.string().url(),synced_version:z.number().int(),sync_status:z.enum(['pending','synced','failed','needs_review']),last_error:z.string().nullable()}).strict();
export type ExternalObjectLink=z.infer<typeof externalObjectLinkSchema>;
const entitySchema=z.object({id:idSchema,version:z.number().int(),fields:fieldsSchema}).strict();
export const projectSnapshotSchema=z.object({project_id:idSchema,run_id:idSchema,scenario_version:z.string(),scenario_date:dateSchema,project_version:z.number().int(),event_cursor:z.number().int(),project_name:z.string().optional(),timezone:z.string().optional(),reported_progress:decimalSchema.optional(),members:z.array(entitySchema),locations:z.array(entitySchema),work:z.array(entitySchema),stock:z.array(entitySchema),issues:z.array(entitySchema),tasks:z.array(entitySchema),needs:z.array(procurementNeedSchema),proposals:z.array(requestProposalSchema),requests:z.array(outboundRequestSchema),decisions:z.array(approvalDecisionSchema),remote_links:z.array(externalObjectLinkSchema)}).strict();
export type ProjectSnapshot=z.infer<typeof projectSnapshotSchema>;
export const reportSnapshotSchema=z.object({id:idSchema,project_id:idSchema,run_id:idSchema,date:dateSchema,version:z.number().int(),generated_at:timestampSchema,sections:z.array(z.object({title:z.string(),text:z.string()}).strict()),evidence_ids:z.array(idSchema),source_ids:z.array(idSchema),request_ids:z.array(idSchema),links:z.array(externalObjectLinkSchema)}).strict();
export type ReportSnapshot=z.infer<typeof reportSnapshotSchema>;
export const loginInputSchema=z.object({username:z.string().min(1).max(100),password:z.string().min(1).max(1024)}).strict();
export const sessionSchema=z.object({user:z.object({id:idSchema,username:z.string(),display_name:z.string(),roles:z.array(roleSchema)}).strict(),project_ids:z.array(idSchema),csrf_token:z.string()}).strict();
export type Session=z.infer<typeof sessionSchema>;
export const clarificationAnswerInputSchema=z.object({token:z.string().min(1),answer:z.string().min(1).max(1000),expected_version:z.number().int().nonnegative()}).strict();
export type ClarificationAnswerInput=z.infer<typeof clarificationAnswerInputSchema>;
export const sourceSnapshotSchema=z.object({id:idSchema,url:z.string().url(),title:z.string().nullable(),retrieved_at:timestampSchema,excerpt:z.string(),provenance:z.enum(['live','cache','fixture'])}).strict();
export const sourcingRowSchema=z.object({candidate:supplierCandidateSchema,candidate_version:z.number().int(),calculation:candidateCalculationSchema.nullable(),delivery_date:dateSchema.nullable(),delivery_status:z.enum(['meets_date','late','unknown']),known_transport:decimalSchema.nullable(),known_tax:decimalSchema.nullable(),source:sourceSnapshotSchema}).strict();
export const sourcingComparisonSchema=z.object({need:procurementNeedSchema,status:z.enum(['pending','researching','completed','failed','needs_configuration']),error:z.string().nullable(),specification:z.string(),rows:z.array(sourcingRowSchema).max(3),unresolved_fields:z.array(z.string()),can_view_costs:z.boolean()}).strict();
export type SourcingComparison=z.infer<typeof sourcingComparisonSchema>;
export type SourcingRow=z.infer<typeof sourcingRowSchema>;
export const sourcingSelectionSchema=z.object({id:idSchema,project_id:idSchema,run_id:idSchema,need:procurementNeedSchema,candidate:supplierCandidateSchema.nullable(),candidate_version:z.number().int().nullable(),calculation:candidateCalculationSchema.nullable(),specification:z.string(),unresolved_fields:z.array(z.string()),created_at:timestampSchema}).strict();
export type SourcingSelection=z.infer<typeof sourcingSelectionSchema>;
export const queryInputSchema=z.object({text:z.string().min(1).max(500)}).strict();
export const queryAnswerSchema=z.object({answer:z.string(),version:z.number().int(),date:dateSchema,evidence_ids:z.array(idSchema),source_ids:z.array(idSchema),status:z.enum(['answered','needs_input'])}).strict();
export type QueryAnswer=z.infer<typeof queryAnswerSchema>;
export const purchaseSchema=z.object({id:idSchema,project_id:idSchema,run_id:idSchema,issuer:z.string().nullable(),reference:z.string().nullable(),invoice_date:dateSchema.nullable(),currency:z.literal('COP'),total:decimalSchema.nullable(),status:z.enum(['recorded','partially_received','received']),evidence_ids:z.array(idSchema),lines:z.array(z.object({id:idSchema,material_id:idSchema,material_name:z.string(),quantity:decimalSchema,received_quantity:decimalSchema,unit:z.string(),unit_price:decimalSchema.nullable(),total:decimalSchema.nullable()}).strict()),receipts:z.array(z.object({id:idSchema,confirmed_at:timestampSchema,lines:z.array(z.object({line_id:idSchema,quantity:decimalSchema}).strict())}).strict()),version:z.number().int()}).strict();
export type Purchase=z.infer<typeof purchaseSchema>;
export const purchaseListSchema=z.object({project_version:z.number().int(),purchases:z.array(purchaseSchema),can_receive:z.boolean(),can_view_costs:z.boolean()}).strict();
export type PurchaseList=z.infer<typeof purchaseListSchema>;
