// Shared by server.js and the Netlify function. Pick ONE provider via env vars:
//   GEMINI_API_KEY    -> Google Gemini (free tier, key from aistudio.google.com)
//   OLLAMA_MODEL      -> local Ollama, no key (e.g. OLLAMA_MODEL=llama3.2)
//   ANTHROPIC_API_KEY -> Claude
const LANG={en:'English',hi:'Hindi',ta:'Tamil',te:'Telugu',kn:'Kannada',bn:'Bengali',mr:'Marathi'};
const SYSTEM=`You write gentle reminiscence activities for older adults, some with early dementia.
Rules: warm, simple words; open questions only; never imply a right or wrong answer; no medical claims; no test-like pressure.
Reply with ONLY a JSON object, no markdown: {"title": string of at most 5 words, "q": array of exactly 3 questions, each under 20 words}.
Write the title and questions in the requested language.`;
const fail=(m,status=502)=>Object.assign(new Error(m),{status});

function clean(i){
  return {interests:(Array.isArray(i.interests)?i.interests:[]).slice(0,8).map(x=>String(x).slice(0,40)),
          memory:String(i.memory||'').slice(0,300), language:LANG[i.language]?i.language:'en'};
}
async function post(url,headers,body){
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
  if(!r.ok) throw fail('Upstream error '+r.status);
  return r.json();
}
const PROVIDERS={
  gemini:async(user)=>{
    const m=process.env.GEMINI_MODEL||'gemini-2.0-flash';
    const d=await post(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,{'x-goog-api-key':process.env.GEMINI_API_KEY},
      {systemInstruction:{parts:[{text:SYSTEM}]},contents:[{role:'user',parts:[{text:user}]}],generationConfig:{responseMimeType:'application/json'}});
    return d.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
  },
  ollama:async(user)=>{
    const d=await post((process.env.OLLAMA_URL||'http://localhost:11434')+'/api/chat',{},
      {model:process.env.OLLAMA_MODEL,stream:false,format:'json',messages:[{role:'system',content:SYSTEM},{role:'user',content:user}]});
    return d.message?.content||'';
  },
  anthropic:async(user)=>{
    const d=await post('https://api.anthropic.com/v1/messages',{'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      {model:process.env.MODEL||'claude-sonnet-5-5',max_tokens:400,system:SYSTEM,messages:[{role:'user',content:user}]});
    return (d.content||[]).map(b=>b.text||'').join('');
  }
};
function pick(){
  const p=process.env.PROVIDER||(process.env.GEMINI_API_KEY?'gemini':process.env.OLLAMA_MODEL?'ollama':process.env.ANTHROPIC_API_KEY?'anthropic':'');
  if(!PROVIDERS[p]) throw fail('No AI provider configured. Set GEMINI_API_KEY, OLLAMA_MODEL or ANTHROPIC_API_KEY.',500);
  return p;
}
async function generate(input){
  const {interests,memory,language}=clean(input);
  const user=`Language: ${LANG[language]}\nInterests: ${interests.join(', ')||'none given'}\nA memory to draw from: ${memory||'none given'}`;
  const text=(await PROVIDERS[pick()](user)).replace(/```json|```/g,'').trim();
  let j; try{ j=JSON.parse(text); }catch(e){ throw fail('Bad model output'); }
  if(typeof j.title!=='string'||!Array.isArray(j.q)||!j.q.length) throw fail('Bad model output');
  return {title:j.title.slice(0,60),q:j.q.slice(0,3).map(x=>String(x).slice(0,160))};
}
module.exports={generate};
