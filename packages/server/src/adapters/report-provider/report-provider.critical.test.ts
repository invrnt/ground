import { describe,it,expect,vi,afterEach } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { normalizedMessageSchema,projectSnapshotSchema,type PrivateFileStore } from '@ground/contracts';
import { ReportProviderAdapter } from './report-provider-adapter';
import { reportProviderConfiguration, type ReportProvider } from './configuration';
import { interpretationEvidence } from '../../modules/operations/export';
import { redact } from '../../modules/operations/redaction';
vi.mock('./audio',()=>({wavAudio:async()=>new Uint8Array([82,73,70,70])}));
const id='00000000-0000-4000-8000-000000000001';
const message=normalizedMessageSchema.parse({provider:'telegram',project_id:id,run_id:id,update_id:'1',chat_id:'1',message_id:'1',sender_id:'1',text:'Reporte',sent_at:'2026-09-12T14:00:00Z',received_at:'2026-09-12T14:00:00Z',reply_to_message_id:null,media:[]});
const context=projectSnapshotSchema.parse({project_id:id,run_id:id,scenario_version:'1',scenario_date:'2026-09-12',project_version:1,event_cursor:0,members:[],locations:[],work:[],stock:[],issues:[],tasks:[],needs:[],proposals:[],requests:[],decisions:[],remote_links:[]});
const extraction={commands:[],missing_fields:[],query_intent:null,irrelevant:true,explicit_receipt:false};
const config={api_key:'test-key',transcription_model:'test/stt',interpretation_model:'test/vision'};
const input={message,context,transcript:null,answer:null};
const completion={id:'gen-1',model:'test/vision',provider:'upstream',choices:[{finish_reason:'stop',message:{content:JSON.stringify(extraction)}}],usage:{cost:0.01}};
function fixture(body:unknown=completion,status=200,files?:PrivateFileStore,provider:ReportProvider='openrouter'){const http=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body),{status,headers:{'x-generation-id':'gen-stt'}}));return {http,adapter:new ReportProviderAdapter({...config,provider},files??{read:async()=>new Uint8Array(),put:async()=>{},remove:async()=>{}},http)};}
function sent(http:ReturnType<typeof fixture>['http']){const request=http.mock.calls[0]?.[1];expect(request?.headers).toMatchObject({Authorization:'Bearer test-key','Content-Type':'application/json'});expect(request?.signal).toBeInstanceOf(AbortSignal);return JSON.parse(String(request?.body));}
describe('OpenRouter HTTP contract',()=>{
 it('uses dedicated JSON STT with raw WAV base64 and records generation/cost',async()=>{const {adapter,http}=fixture({text:'Llegaron materiales',usage:{seconds:1,cost:0.001}});const result=await adapter.transcribeAudio(new Uint8Array([1]));expect(http.mock.calls[0]?.[0]).toBe('https://openrouter.ai/api/v1/audio/transcriptions');expect(sent(http)).toEqual({model:'test/stt',input_audio:{data:'UklGRg==',format:'wav'},language:'es',response_format:'json'});expect(result.metadata).toMatchObject({provider:'openrouter',model:'test/stt',request_id:'gen-stt',cost:0.001});});
 it('sends private images/PDFs, native PDF processing and required strict schema',async()=>{const pdf=await PDFDocument.create();pdf.addPage();const bytes=await pdf.save();const {adapter,http}=fixture(completion,200,{read:async()=>bytes,put:async()=>{},remove:async()=>{}});const media=[{id,provider_file_id:'photo',filename:null,kind:'photo',mime_type:'image/jpeg',sha256:'a'.repeat(64),size_bytes:bytes.length},{id,provider_file_id:'pdf',filename:'source.pdf',kind:'document',mime_type:'application/pdf',sha256:'b'.repeat(64),size_bytes:bytes.length}];const result=await adapter.interpretReport({...input,message:normalizedMessageSchema.parse({...message,media})});expect(http.mock.calls[0]?.[0]).toBe('https://openrouter.ai/api/v1/chat/completions');const request=sent(http);expect(request.provider).toEqual({require_parameters:true});expect(request.response_format).toMatchObject({type:'json_schema',json_schema:{strict:true,schema:{additionalProperties:false,required:['commands','missing_fields','query_intent','irrelevant','explicit_receipt']}}});expect(request.plugins).toEqual([{id:'file-parser',pdf:{engine:'native'}}]);expect(request.messages[1].content[1]).toMatchObject({type:'image_url',image_url:{url:expect.stringMatching(/^data:image\/jpeg;base64,/)}});expect(request.messages[1].content[2]).toMatchObject({type:'file',file:{filename:'source.pdf',file_data:expect.stringMatching(/^data:application\/pdf;base64,/)}});expect(result.extraction).toEqual(extraction);expect(result.metadata).toMatchObject({provider:'openrouter',upstream_provider:'upstream',request_id:'gen-1',cost:0.01});});
 it.each([[401,false],[429,true],[503,true]])('classifies HTTP %s without internal retry',async(status,retryable)=>{const {adapter,http}=fixture({},status);await expect(adapter.interpretReport(input)).rejects.toMatchObject({code:'PROVIDER_UNAVAILABLE',retryable});expect(http).toHaveBeenCalledTimes(1);});
 it.each([{...completion,choices:[{finish_reason:'length',message:{content:JSON.stringify(extraction)}}]},{...completion,choices:[{finish_reason:'stop',message:{content:null,refusal:'No'}}]},{...completion,choices:[{finish_reason:'stop',message:{content:'invalid'}}]}])('rejects incomplete/refused/malformed results',async body=>{const {adapter}=fixture(body);await expect(adapter.interpretReport(input)).rejects.toMatchObject({code:'VALIDATION_ERROR'});});
 it('handles 200 provider errors and transport failures without inventing results',async()=>{const {adapter,http}=fixture({error:{code:429,message:'sensitive details'}});await expect(adapter.interpretReport(input)).rejects.toMatchObject({code:'PROVIDER_UNAVAILABLE',retryable:true});http.mockRejectedValue(new Error('network'));await expect(adapter.interpretReport(input)).rejects.toMatchObject({code:'PROVIDER_UNAVAILABLE',retryable:true});});
 it('preserves old provider attribution alongside new gateway/model evidence',()=>{const result=interpretationEvidence([{input_id:id,status:'completed',metadata:{interpretation:{model:'gpt-4.1',request_id:'old'}}},{input_id:id,status:'completed',metadata:{interpretation:{provider:'openrouter',model:'openai/gpt-4.1',request_id:'new',cost:0.01}}}]);expect(result.calls.map(call=>[call.provider,call.request_id,call.cost_usd])).toEqual([['openai','old',null],['openrouter','new','0.01']]);expect(Object.keys(result.models)).toContain('openai:interpretation:gpt-4.1');expect(Object.keys(result.models)).toContain('openrouter:interpretation:openai/gpt-4.1');});
 it('redacts OpenRouter token strings',()=>{expect(redact('key sk-or-v1-abcdefghijklmnopqrstuv')).not.toContain('abcdefghijklmnopqrstuv');});
});


describe('Vercel AI Gateway contract',()=>{
 afterEach(()=>vi.unstubAllEnvs());
 it('selects only the active configuration and rejects invalid selection without exposing values',()=>{
  const openrouter={OPENROUTER_API_KEY:'or-key',OPENROUTER_TRANSCRIPTION_MODEL:'or/stt',OPENROUTER_INTERPRETATION_MODEL:'or/vision'};
  expect(reportProviderConfiguration(openrouter).config).toMatchObject({provider:'openrouter',api_key:'or-key'});
  expect(reportProviderConfiguration({...openrouter,AI_PROVIDER:'vercel'})).toMatchObject({provider:'vercel',config:null,problems:['AI_GATEWAY_API_KEY is not configured','AI_GATEWAY_TRANSCRIPTION_MODEL is not configured','AI_GATEWAY_INTERPRETATION_MODEL is not configured']});
  expect(reportProviderConfiguration({AI_PROVIDER:'vercel',AI_GATEWAY_API_KEY:'gateway-key',AI_GATEWAY_TRANSCRIPTION_MODEL:'vg/stt',AI_GATEWAY_INTERPRETATION_MODEL:'vg/vision'}).config).toMatchObject({provider:'vercel',api_key:'gateway-key',transcription_model:'vg/stt',interpretation_model:'vg/vision'});
  expect(reportProviderConfiguration({AI_PROVIDER:'sensitive-invalid-value'})).toEqual({provider:null,config:null,problems:['AI_PROVIDER must be openrouter or vercel']});
  expect(reportProviderConfiguration({...openrouter,OPENROUTER_API_KEY:'  '}).config).toBeNull();
 });
 it('uses Vercel REST transcription protocol and leaves absent cost and upstream unknown',async()=>{
  const {adapter,http}=fixture({text:'Llegaron materiales',language:'es',durationInSeconds:1,warnings:[]},200,undefined,'vercel');
  const result=await adapter.transcribeAudio(new Uint8Array([1]));
  expect(http.mock.calls[0]?.[0]).toBe('https://ai-gateway.vercel.sh/v4/ai/transcription-model');
  expect(http.mock.calls[0]?.[1]?.headers).toMatchObject({'ai-gateway-protocol-version':'0.0.1','ai-transcription-model-specification-version':'4','ai-model-id':'test/stt'});
  expect(sent(http)).toEqual({audio:'UklGRg==',mediaType:'audio/wav'});
  expect(result).toMatchObject({text:'Llegaron materiales',metadata:{provider:'vercel',model:'test/stt',cost:null,upstream_provider:null}});
  expect(result.derivative).toEqual(new Uint8Array([82,73,70,70]));
 });
 it('sends image and PDF with JSON Schema and omits OpenRouter-only options',async()=>{
  const pdf=await PDFDocument.create();pdf.addPage();const bytes=await pdf.save();
  const {adapter,http}=fixture({id:'vercel-generation',choices:completion.choices,usage:{prompt_tokens:2,completion_tokens:3}},200,{read:async()=>bytes,put:async()=>{},remove:async()=>{}},'vercel');
  const media=[{id,provider_file_id:'photo',filename:null,kind:'photo',mime_type:'image/jpeg',sha256:'a'.repeat(64),size_bytes:bytes.length},{id,provider_file_id:'pdf',filename:'source.pdf',kind:'document',mime_type:'application/pdf',sha256:'b'.repeat(64),size_bytes:bytes.length}];
  const result=await adapter.interpretReport({...input,message:normalizedMessageSchema.parse({...message,media})});
  expect(http.mock.calls[0]?.[0]).toBe('https://ai-gateway.vercel.sh/v1/chat/completions');
  const request=sent(http);expect(request.provider).toBeUndefined();expect(request.plugins).toBeUndefined();
  expect(request.response_format).toMatchObject({type:'json_schema',json_schema:{schema:{additionalProperties:false}}});
  expect(request.messages[1].content[1]).toMatchObject({type:'image_url',image_url:{url:expect.stringMatching(/^data:image\/jpeg;base64,/)}});
  expect(request.messages[1].content[2]).toMatchObject({type:'file',file:{file_data:expect.stringMatching(/^data:application\/pdf;base64,/)}});
  expect(result).toMatchObject({extraction,metadata:{provider:'vercel',request_id:'vercel-generation',cost:null,upstream_provider:null,usage:{prompt_tokens:2,completion_tokens:3}}});
 });
 it.each([[401,false],[429,true],[503,true]])('classifies Vercel HTTP %s without retries or leaking errors',async(status,retryable)=>{
  const {adapter,http}=fixture({error:{code:'invalid_request_error',message:'sensitive body'}},status,undefined,'vercel');
  await expect(adapter.interpretReport(input)).rejects.toMatchObject({code:'PROVIDER_UNAVAILABLE',retryable,message:'El proveedor no pudo procesar el reporte.'});expect(http).toHaveBeenCalledTimes(1);
 });
 it.each([{error:{code:'missing_parameter'}},{...completion,choices:[{finish_reason:'length',message:{content:JSON.stringify(extraction)}}]},{...completion,choices:[{finish_reason:'stop',message:{content:null,refusal:'No'}}]},{...completion,choices:[{finish_reason:'stop',message:{content:'{}'}}]}])('rejects symbolic errors and invalid extraction',async body=>{
  const {adapter}=fixture(body,200,undefined,'vercel');await expect(adapter.interpretReport(input)).rejects.toThrow();
 });
 it('preserves all provider histories and redacts a gateway key without relying on its prefix',()=>{
  vi.stubEnv('AI_GATEWAY_API_KEY','gateway-secret-for-test');
  expect(redact({message:'value gateway-secret-for-test'})).toEqual({message:'value [REDACTED]'});
  const result=interpretationEvidence([{input_id:id,status:'completed',metadata:{interpretation:{model:'legacy'}}},{input_id:id,status:'completed',metadata:{interpretation:{provider:'openrouter',model:'or/model',cost:0.01}}},{input_id:id,status:'completed',metadata:{interpretation:{provider:'vercel',model:'vg/model',request_id:'vg-id',cost:null}}}]);
  expect(result.calls.map(call=>[call.provider,call.cost_usd])).toEqual([['openai',null],['openrouter','0.01'],['vercel',null]]);
  expect(result.models['vercel:interpretation:vg/model']).toBe('vg/model');
 });
});
