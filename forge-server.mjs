import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {Forge} from './dist/forge.js';
export async function createRoomServer({port=3579,host='0.0.0.0',saved=null,seed=8241}={}){
 const forge=new Forge(seed,saved),token=crypto.randomBytes(24).toString('hex'),peers=new Map();let hostId=null,uid=0,closed=false;
 const server=http.createServer((_q,r)=>{r.writeHead(200,{'Content-Type':'application/json'});r.end(JSON.stringify({game:'ORBIT FOUNDRY',players:peers.size}));});
 const wss=new WebSocketServer({server,path:'/signal',maxPayload:8192,perMessageDeflate:false});
 const send=(ws,msg)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<1500000)ws.send(JSON.stringify(msg));};
 const broadcast=msg=>{for(const p of peers.values())send(p.ws,msg);};
 wss.on('connection',ws=>{let peer=null,count=0;const timer=setTimeout(()=>{if(!peer)ws.close(1008);},6000);const rate=setInterval(()=>count=0,1000);ws.on('error',()=>{});ws.on('message',raw=>{if(++count>100){ws.close(1008);return;}let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object'||Array.isArray(m))return;if(!peer){if(m.type!=='hello'||m.version!==2){send(ws,{type:'error',message:'같은 ORBIT FOUNDRY 버전을 사용하세요.'});ws.close();return;}if(peers.size>=4){send(ws,{type:'error',message:'공방이 가득 찼습니다. 최대 4명까지 참가할 수 있습니다.'});ws.close();return;}if(!hostId&&m.token!==token){send(ws,{type:'error',message:'방장이 접속 중입니다. 잠시 뒤 다시 시도하세요.'});ws.close();return;}peer={id:`p${++uid}`,ws};peers.set(peer.id,peer);if(!hostId)hostId=peer.id;forge.addPlayer(peer.id,m.name,peers.size-1);clearTimeout(timer);send(ws,{type:'welcome',id:peer.id,hostId,state:forge.s});broadcast({type:'notice',message:`${forge.s.players.find(p=>p.id===peer.id).name} 님이 공방에 도착했습니다.`});return;}
  if(m.type==='move')forge.move(peer.id,m,.1);
  if(m.type==='action'){const result=forge.action(peer.id,m);if(result.message)send(ws,{type:'notice',message:result.message});}
  if(m.type==='command'&&typeof m.text==='string'&&m.text.length<250){const message=forge.command(peer.id,m.text);send(ws,{type:'notice',message});}
  if(m.type==='chat'&&typeof m.text==='string'){broadcast({type:'chat',name:forge.s.players.find(p=>p.id===peer.id)?.name||'동료',text:m.text.slice(0,160).replace(/[<>]/g,'')});}
 });ws.on('close',()=>{clearTimeout(timer);clearInterval(rate);if(peer){peers.delete(peer.id);forge.removePlayer(peer.id);if(hostId===peer.id)hostId=peers.keys().next().value||null;}});});
 let last=performance.now(),acc=0,frame=0;const interval=setInterval(()=>{const now=performance.now();acc+=Math.min(.12,(now-last)/1000);last=now;while(acc>=1/60){forge.step(1/60);acc-=1/60;}if(++frame%4===0)broadcast({type:'state',hostId,state:forge.s});},1000/60);
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(ws.alive===false){ws.terminate();continue;}ws.alive=false;ws.ping();}},12000);wss.on('connection',ws=>{ws.alive=true;ws.on('pong',()=>ws.alive=true);});
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});}catch(e){clearInterval(interval);clearInterval(heartbeat);wss.close();throw e;}
 const actualPort=server.address().port;const addresses=[];for(const group of Object.values(os.networkInterfaces()))for(const item of group||[])if(item.family==='IPv4'&&!item.internal&&!item.address.startsWith('169.254.'))addresses.push(`${item.address}:${actualPort}`);
 return{port:actualPort,hostToken:token,addresses,get forge(){return forge;},async close(){if(closed)return;closed=true;clearInterval(interval);clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();await new Promise(resolve=>wss.close(()=>server.close(resolve)));}};
}
