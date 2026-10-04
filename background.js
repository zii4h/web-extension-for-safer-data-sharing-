const sessions=new Map();
chrome.runtime.onConnect.addListener(port=>{connect(port).catch(()=>{try{port.disconnect();}catch{}});});
async function connect(port){
  const sender=port.sender;
  if(port.name==='jito-host'&&sender?.frameId===0&&/^https?:\/\//.test(sender.url||'')){
    const origin=new URL(sender.url).origin;
    if(!await chrome.permissions.contains({origins:[origin+'/*']})){port.disconnect();return;}
    const token=crypto.randomUUID(),entry={host:port,tab:sender.tab.id,origin,review:null,sent:false};
    sessions.set(token,entry);port.postMessage({type:'session',token});
    port.onMessage.addListener(message=>{if(message.type==='result')entry.review?.postMessage(message);});
    port.onDisconnect.addListener(()=>{entry.review?.disconnect();sessions.delete(token);});return;
  }
  const token=port.name.startsWith('jito-review:')?port.name.slice(12):'',entry=sessions.get(token);
  if(!entry||entry.review||sender?.tab?.id!==entry.tab||!sender.url?.startsWith(chrome.runtime.getURL('workspace.html')+'#attach=')){port.disconnect();return;}
  entry.review=port;port.postMessage({type:'ready',destination:entry.origin});
  port.onMessage.addListener(async message=>{
    if(message.type!=='attach')return;
    if(entry.sent){port.postMessage({type:'result',ok:false,message:'This session was already used. Close the panel to start again.'});return;}
    entry.sent=true;
    if(!await chrome.permissions.contains({origins:[entry.origin+'/*']})){port.postMessage({type:'result',ok:false,message:'Site permission was removed. Nothing was handed over.'});return;}
    if(typeof message.base64!=='string'||message.base64.length>20*1024*1024||!['image/png','text/plain'].includes(message.mime)||!/^jito-sharing-copy\.(png|txt)$/.test(message.name)){port.postMessage({type:'result',ok:false,message:'Invalid output or image too large. Nothing was handed over.'});return;}
    try{entry.host.postMessage({type:'attach',base64:message.base64,mime:message.mime,name:message.name});}catch{port.postMessage({type:'result',ok:false,message:'The website connection closed. Nothing further can be sent.'});}
  });
  port.onDisconnect.addListener(()=>{if(entry.review===port)entry.review=null;});
}

