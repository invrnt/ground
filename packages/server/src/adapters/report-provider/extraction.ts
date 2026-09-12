import { z } from 'zod';
import type { ReportProvider } from './configuration';
import { operationProposalSchema } from '@ground/contracts';
export const extractionSchema = z.object({
  commands: z.array(z.object({ type: z.enum(['complete_work_item','consume_material','report_issue','assign_review','update_assignment','resolve_issue','correct_operation','register_purchase','confirm_receipt']), entity_ids: z.array(z.object({ name:z.string(), reference:z.string() }).strict()), fields_json:z.string() }).strict()).max(12),
  missing_fields:z.array(z.string()).max(2), query_intent:z.string().nullable(), irrelevant:z.boolean(), explicit_receipt:z.boolean(),
}).strict();
export type Extraction = z.infer<typeof extractionSchema>;
export const commandShapes = operationProposalSchema.options.map(schema=>({ type:schema.shape.type.value,entity_ids:Object.keys(schema.shape.entity_ids.shape),fields:Object.keys(schema.shape.fields.shape) }));
export interface ProviderMetadata { provider:ReportProvider; upstream_provider:string|null; model:string; request_id:string|null; duration_ms:number; usage:unknown; cost:number|null; prompt_version:string; schema_version:number; }
export interface ExtractedReport { extraction:Extraction; metadata:ProviderMetadata; }
export const PROMPT_VERSION='ground-interpretation-v2-en';
export const SCHEMA_VERSION=1;
