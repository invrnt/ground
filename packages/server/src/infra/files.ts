import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { GroundError, idSchema, type PrivateFileStore } from '@ground/contracts';
export class LocalPrivateFiles implements PrivateFileStore {
 constructor(private readonly root: string) {}
 private path(id: string) { return join(this.root,idSchema.parse(id)); }
 async put(input: {id:string;bytes:Uint8Array;content_type:string;sha256:string}) {
  if(input.bytes.length>20*1024*1024 || !/^(image\/(jpeg|png|webp)|audio\/(ogg|mpeg|mp4|wav)|application\/pdf)$/.test(input.content_type)) throw new GroundError('VALIDATION_ERROR','Unsupported file');
  if(createHash('sha256').update(input.bytes).digest('hex')!==input.sha256) throw new GroundError('VALIDATION_ERROR','File hash mismatch');
  await mkdir(this.root,{recursive:true,mode:0o700});
  try { await writeFile(this.path(input.id),input.bytes,{flag:'wx',mode:0o600}); }
  catch(error) { if(!(error instanceof Error && 'code' in error && error.code==='EEXIST')) throw error; const existing=await this.read(input.id); if(createHash('sha256').update(existing).digest('hex')!==input.sha256) throw new GroundError('CONFLICT','File already exists'); }
 }
 async read(id:string) { return readFile(this.path(id)); }
 async remove(id:string) { await unlink(this.path(id)); }
}
