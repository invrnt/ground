import { spawn } from 'node:child_process';
import { GroundError } from '@ground/contracts';
/** Decode with a fixed command and bounded output. No filenames or source strings become arguments. */
export async function wavAudio(bytes:Uint8Array, binary='ffmpeg'):Promise<Uint8Array> {
  if(bytes.byteLength>10*1024*1024)throw new GroundError('VALIDATION_ERROR','Audio exceeds 10 MB.');
  const pcm=await new Promise<Buffer>((resolve,reject)=> {
    const process=spawn(binary,['-hide_banner','-loglevel','error','-i','pipe:0','-t','61','-vn','-ac','1','-ar','16000','-f','s16le','pipe:1'],{stdio:['pipe','pipe','pipe']});
    const chunks:Buffer[]=[]; let size=0; let settled=false;
    const finish=(error?:GroundError)=> {if(settled)return;settled=true;clearTimeout(timer);if(error)reject(error);else resolve(Buffer.concat(chunks));};
    const timer=setTimeout(()=>{process.kill('SIGKILL');finish(new GroundError('PROVIDER_UNAVAILABLE','Audio conversion took too long.',true));},15000);
    process.on('error',()=>finish(new GroundError('NOT_READY','Audio conversion requires ffmpeg.')));
    process.stdout.on('data',(chunk:Buffer)=> {size+=chunk.length;if(size>61*32000){process.kill('SIGKILL');finish(new GroundError('VALIDATION_ERROR','Audio must be no longer than 60 seconds.'));}else chunks.push(chunk);});
    process.stderr.resume();
    process.stdin.on('error',()=>finish(new GroundError('VALIDATION_ERROR','I could not read the audio.')));
    process.on('close',code=>finish(code===0?undefined:new GroundError('VALIDATION_ERROR','I could not read the audio. Send a clear recording.')));
    process.stdin.end(bytes);
  });
  if(pcm.length===0||pcm.length>60*32000)throw new GroundError('VALIDATION_ERROR','Audio must be between 1 and 60 seconds long.');
  const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(16000,24);header.writeUInt32LE(32000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
  return Buffer.concat([header,pcm]);
}
