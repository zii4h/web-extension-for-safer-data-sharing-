/* Generic, opt-in standard-file-input adapter. Originals are selected only
   inside the extension iframe; no change-event interception is claimed safe. */
(()=>{
  'use strict';
  if(window.__jitoSiteActive)return;window.__jitoSiteActive=true;
  const host=document.createElement('div');host.id='jito-extension-host';
  const shadow=host.attachShadow({mode:'open'}),style=document.createElement('style');
  style.textContent=`:host{all:initial}button,select{font:600 13px system-ui;color:white;background:#942b42;border:1px solid #e99cab;border-radius:10px;padding:11px 14px}button,select{cursor:pointer}button:focus-visible,select:focus-visible{outline:3px solid white;outline-offset:3px}.launcher{position:fixed;bottom:26px;right:22px;z-index:2147483646;box-shadow:0 4px 24px #0006}.launcher small{display:block;font:10px system-ui;margin-top:4px;color:#ffdae3}dialog{width:min(1120px,94vw);height:90vh;padding:0;background:#19191d;border:1px solid #855363;border-radius:14px;color:white;max-width:none;max-height:none}dialog::backdrop{background:#000b}header{min-height:62px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:8px 16px;font:12px system-ui}select{width:290px;max-width:290px;font-size:11px;background:#342530;appearance:none;padding-right:34px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='white' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center}iframe{width:100%;height:calc(100% - 90px);border:0;background:#101012}.toast{position:fixed;bottom:100px;right:22px;max-width:390px;padding:16px;background:#271b23;color:white;font:13px/1.5 system-ui;border:1px solid #e99cab;border-radius:10px;z-index:2147483647}`;
  const launch=document.createElement('button');launch.className='launcher';launch.type='button';launch.textContent='JITO · Review & attach';
  const hint=document.createElement('small');hint.textContent='Standard file pickers · Enabled here';launch.append(hint);
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','JITO privacy checkpoint');
  const header=document.createElement('header'),title=document.createElement('span'),close=document.createElement('button'),targets=document.createElement('select');targets.setAttribute('aria-label','Destination upload control');
  title.textContent='JITO → '+location.hostname;close.textContent='Close';close.type='button';header.append(title,targets,close);dialog.append(header);shadow.append(style,launch,dialog);
  function mount(){if(!host.isConnected&&document.documentElement)document.documentElement.append(host);}
  if(document.documentElement)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
  let port=null,frame=null,heartbeat=null,openedURL='',delivered=false,targetRefs=[],explicitTarget=null;
  function notify(message){shadow.querySelector('.toast')?.remove();const box=document.createElement('div');box.className='toast';box.setAttribute('role','status');box.textContent=message;shadow.append(box);setTimeout(()=>box.remove(),18000);}
  function dismiss(){clearInterval(heartbeat);const old=port;port=null;if(dialog.open)dialog.close();old?.disconnect();frame?.remove();frame=null;launch.focus();}
  close.addEventListener('click',dismiss);dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
  window.addEventListener('message',event=>{if(event.data?.type==='jito-close-after-success'&&frame&&event.source===frame.contentWindow)setTimeout(dismiss,100);});
  function accepts(accept,file){return !accept||accept.split(',').some(value=>{const rule=value.trim().toLowerCase();return rule==='*/*'||rule===file.type||rule.startsWith('.')&&file.name.endsWith(rule)||rule.endsWith('/*')&&file.type.startsWith(rule.slice(0,-1));});}
  const valid=input=>input?.isConnected&&input.type==='file'&&!input.disabled&&!input.webkitdirectory&&!input.hasAttribute('capture');
  function targetInput(file){
    if(explicitTarget){if(!valid(explicitTarget))throw new Error('The selected upload control changed or disappeared. Close JITO and click the website upload button again.');if(!accepts(explicitTarget.accept,file))throw new Error('This upload control does not accept the cleaned output type ('+file.type+'). Nothing was handed over.');return explicitTarget;}
    if(targets.value!=='auto'){const chosen=targetRefs[Number(targets.value)];if(!valid(chosen)||!accepts(chosen.accept,file))throw new Error('Selected destination is unavailable or does not accept this output type. Nothing was handed over.');return chosen;}
    const candidates=[...document.querySelectorAll('input[type="file"]')].filter(input=>valid(input)&&accepts(input.accept,file));
    if(candidates.length===1)return candidates[0];
    throw new Error('Could not identify one compatible upload control. Close JITO and click the website’s upload button, or select a destination from the panel header. Nothing was handed over.');
  }
  function open(target=null){
    if(dialog.open||port)return;
    mount();explicitTarget=target;openedURL=location.href;delivered=false;
    targetRefs=[...document.querySelectorAll('input[type="file"]')].filter(valid);
    targets.replaceChildren();const auto=document.createElement('option');auto.value='auto';auto.textContent=target?'Destination: the upload button you clicked':'Auto: use the only compatible upload control';targets.append(auto);
    targetRefs.forEach((input,i)=>{const option=document.createElement('option');option.value=String(i);const label=input.labels?.[0]?.textContent?.trim()||input.getAttribute('aria-label')||`Upload control ${i+1}`;option.textContent=label.slice(0,65)+' · '+(input.accept||'any file');targets.append(option);});targets.disabled=!!target;
    try{
      port=chrome.runtime.connect({name:'jito-host'});
      port.onMessage.addListener(message=>{
        if(message.type==='session'){frame=document.createElement('iframe');frame.title='JITO private file review';frame.src=chrome.runtime.getURL('workspace.html')+'#attach='+message.token;dialog.append(frame);dialog.showModal();}
        if(message.type==='attach'){
          try{
            if(delivered||!dialog.open||location.href!==openedURL)throw new Error('The page or review session changed. Reopen JITO; nothing was handed over.');
            const bytes=Uint8Array.from(atob(message.base64||''),c=>c.charCodeAt(0));
            if(!bytes.byteLength)throw new Error('The cleaned image was empty. Nothing was handed over.');
            const file=new File([bytes],message.name,{type:message.mime,lastModified:Date.now()});
            const input=targetInput(file),transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;delivered=true;
            input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
            port.postMessage({type:'result',ok:true,message:'Cleaned copy handed to '+location.hostname+'’s upload control. Close this panel and confirm the website accepts the attachment. This does not confirm server upload completion.'});
            notify('JITO handed over the cleaned copy. Check the website’s attachment preview. No submit or send button was pressed.');
            setTimeout(dismiss,250);
          }catch(error){port?.postMessage({type:'result',ok:false,message:error.message});}
        }
      });
      const connection=port;
      port.onDisconnect.addListener(()=>{clearInterval(heartbeat);if(port===connection&&!delivered)notify('JITO disconnected. This picker was stopped. Close the panel and reload this page before retrying.');});
      heartbeat=setInterval(()=>{try{port?.postMessage({type:'heartbeat'});}catch{clearInterval(heartbeat);}},20000);
    }catch{notify('JITO was updated or disconnected. Refresh this page.');}
  }
  launch.addEventListener('click',()=>open());
  function intercept(event){
    const input=event.composedPath().find(node=>node instanceof HTMLInputElement&&node.type==='file');
    let target=input||null;
    // ChatGPT's visible "Add files and more" control opens a hidden native
    // input programmatically, so the input itself is not in this click path.
    // Bind that button to the site's file input before its menu can open.
    if(!target){
      const element=event.composedPath().find(node=>node instanceof Element);
      const label=(element?.getAttribute('aria-label')||element?.getAttribute('title')||element?.textContent||'').toLowerCase();
      if(location.hostname==='chatgpt.com' && /add files|attach file|upload/.test(label)){
        target=document.querySelector('#octane-mobile-composer-files-input,input[type="file"][data-octane-native-file-picker],input[type="file"]');
      }
    }
    if(!target)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!valid(target)){notify('JITO does not handle folders or camera capture. This picker was stopped. Use a supported file upload instead.');return;}
    open(target);
  }
  window.addEventListener('click',intercept,true);
  function interceptDrop(event){
    const files=event.dataTransfer?.files;
    if(!files||!files.length)return;
    // A dropped file is exposed to the page at the drop event. Stop it during
    // capture before the SaaS's listeners can inspect or upload it. The user
    // then selects the same file inside the extension review frame.
    event.preventDefault();event.stopImmediatePropagation();
    const compatible=[...document.querySelectorAll('input[type="file"]')].find(input=>valid(input));
    notify('JITO stopped this file drop before the website received it. Choose the file inside the JITO panel to review it.');
    open(compatible||null);
  }
  window.addEventListener('drop',interceptDrop,true);
  window.addEventListener('dragover',event=>{if(event.dataTransfer?.types?.includes('Files')){event.preventDefault();event.stopImmediatePropagation();}},true);
  function disable(){dismiss();window.removeEventListener('click',intercept,true);window.removeEventListener('drop',interceptDrop,true);document.removeEventListener('DOMContentLoaded',mount);host.remove();window.__jitoSiteActive=false;chrome.runtime.onMessage.removeListener(onMessage);}
  function onMessage(message){if(message.type==='jito-disable')disable();}
  chrome.runtime.onMessage.addListener(onMessage);
})();

