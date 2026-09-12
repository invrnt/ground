// Read-only, bounded Exa capability check. Run explicitly with EXA_API_KEY loaded.
import { z } from 'zod';
const key=process.env['EXA_API_KEY'];
if(!key) throw new Error('EXA_API_KEY is missing');
async function post(path:string,body:unknown) {
 const response=await fetch(`https://api.exa.ai/${path}`,{method:'POST',headers:{'x-api-key':key ?? '', 'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20_000)});
 if(!response.ok) throw new Error(`Exa ${path}: HTTP ${response.status}`);
 return response.json();
}
const result=z.object({results:z.array(z.object({url:z.string().url()}))}).parse(await post('search',{query:'porcelanato gris 60x60 Colombia',numResults:1}));
const urls=result.results.map(item=>item.url);
const content=z.object({results:z.array(z.object({url:z.string().url(),text:z.string().optional()}))}).parse(await post('contents',{urls,text:{maxCharacters:500}}));
console.info({provider:'exa',search_results:urls,content_results:content.results.length});
