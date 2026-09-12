import type { ActorContext,InventoryReceiptInput,DomainEvent,JobQueue,OperationResult,TransactionContext } from '@ground/contracts';
import type pg from 'pg';
import type { PgTransactions } from '../../infra/database';
export interface ProposalInvalidation { changed(input:{context:ActorContext;operation_id:string;need_id:string;need_version:number;reason:string},tx:TransactionContext):Promise<void>; }
export interface SiteDependencies {transactions:PgTransactions;queue:JobQueue;invalidation?:ProposalInvalidation;}
export interface Mutation { diff:OperationResult['state_diff']; events:{type:DomainEvent['type'];entity_id:string;version:number;summary:string;fields:string[]}[]; unchanged?:boolean; needs_input?:string; }
export interface CommandScope {db:pg.PoolClient;context:ActorContext;operation_id:string;source_message_id:string;evidence_ids:string[];version:number;tx:TransactionContext;}
export type ReceiptMovement=InventoryReceiptInput;
