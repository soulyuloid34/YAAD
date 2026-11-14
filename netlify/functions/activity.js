const {generate}=require('../../generate');
exports.handler=async(event)=>{
  if(event.httpMethod!=='POST') return {statusCode:405,body:'{"error":"POST only"}'};
  try{ const out=await generate(JSON.parse((event.body||'{}').slice(0,10000)));
       return {statusCode:200,headers:{'content-type':'application/json'},body:JSON.stringify(out)}; }
  catch(e){ return {statusCode:e.status||500,body:JSON.stringify({error:e.message})}; }
};
