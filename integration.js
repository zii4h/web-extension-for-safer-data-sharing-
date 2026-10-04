/* This runs in the extension frame, never in the SaaS document. */
(() => {
  const token=location.hash.startsWith('#attach=')?location.hash.slice(8):null;
  if(!token)return;
  let ready=false,used=false,pending=null;
  const port=chrome.runtime.connect({name:'jito-review:'+token});
  const button=document.getElementById('download');
  button.textContent='Attach cleaned copy to website';
  document.getElementById('demo').hidden=true;
  document.getElementById('output-name').disabled=true;
  document.querySelector('.name-label').firstChild.textContent='Sharing-copy name ';
  document.querySelector('.topbar').hidden=true;
  document.querySelector('aside').hidden=true;
  document.querySelector('.layout').classList.add('integrated');
  document.querySelector('.section-heading h2').textContent='Review before attaching';
  document.getElementById('download').nextElementSibling.textContent='Approval shares the cleaned copy with the destination website immediately. Your original stays inside this extension frame. Page drop, paste, direct filesystem APIs, and embedded upload frames are not covered.';
  function fail(message){ready=false;button.disabled=true;status(message,true);pending?.reject(new Error(message));pending=null;}
  port.onMessage.addListener(message=>{
    if(message.type==='ready'){ready=true;document.querySelector('.section-heading h2').textContent='Review before attaching to '+message.destination;status('Connected to '+message.destination+'. Choose a file inside JITO.');}
    if(message.type==='result'&&pending){const p=pending;pending=null;message.ok?p.resolve(message.message):p.reject(new Error(message.message));}
  });
  port.onDisconnect.addListener(()=>fail('Connection closed. Close this panel and reopen JITO. No further file can be attached from this session.'));
  window.JitoHandoff={
    available:()=>ready&&!used,
    closeAfterSuccess:()=>window.parent.postMessage({type:'jito-close-after-success'},'*'),
    async send(blob){
      if(!ready||used)throw new Error('This handoff session is unavailable. Close the panel and reopen JITO.');
      used=true;
      if(blob.size>14*1024*1024)throw new Error('The cleaned image is too large to attach through this browser. Resize the image locally and try again.');
      const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';
      for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
      const mime=blob.type.startsWith('image/')?'image/png':'text/plain';
      return new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>{pending=null;reject(new Error('No handoff acknowledgment received. Check the website attachment preview before retrying; a copy may already have been handed over.'));},15000);
        pending={resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}};
        try{port.postMessage({type:'attach',mime,name:'jito-sharing-copy.'+(mime==='image/png'?'png':'txt'),base64:btoa(binary)});}catch(error){pending.reject(error);pending=null;}
      });
    }
  };
})();



