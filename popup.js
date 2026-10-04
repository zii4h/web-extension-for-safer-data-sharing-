const note=document.getElementById('site-status'),enable=document.getElementById('enable-site'),disable=document.getElementById('disable-site');
let tab,pattern,registrationId;
document.getElementById('open').addEventListener('click',()=>{chrome.tabs.create({url:chrome.runtime.getURL('workspace.html')});window.close();});
(async()=>{
  [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  const url=new URL(tab.url);
  if(!['https:','http:'].includes(url.protocol))throw new Error('Open a regular website to enable its upload checkpoint.');
  pattern=url.origin+'/*';
  registrationId='jito-'+[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pattern)))].map(n=>n.toString(16).padStart(2,'0')).join('');
  document.getElementById('site-name').textContent=url.hostname;
  const registered=await chrome.scripting.getRegisteredContentScripts({ids:[registrationId]});
  const active=registered.length>0 && await chrome.permissions.contains({origins:[pattern]});
  enable.disabled=active;disable.disabled=!active;note.textContent=active?'Enabled here. Standard file-picker clicks open JITO. Refresh tabs after an extension update.':'Enable this site to add the review popup and intercept supported file-picker clicks.';
})().catch(error=>{note.textContent=error.message;});
enable.addEventListener('click',async()=>{
  try{
    if(!pattern)return;
    // Site access is declared at install time, so this no longer opens a
    // permission prompt that would close the popup mid-enable.
    if(!await chrome.permissions.contains({origins:[pattern]})){note.textContent='JITO does not have access to this site. Reinstall the updated extension and allow website access.';return;}
    const previous=await chrome.scripting.getRegisteredContentScripts({ids:[registrationId]});
    if(!previous.length)await chrome.scripting.registerContentScripts([{id:registrationId,matches:[pattern],js:['site.js'],runAt:'document_start',persistAcrossSessions:true}]);
    note.textContent='Starting JITO on this site…';
    let lastError;
    for(let attempt=0;attempt<3;attempt++){
      await new Promise(resolve=>setTimeout(resolve,150*(attempt+1)));
      try{await chrome.scripting.executeScript({target:{tabId:tab.id},files:['site.js']});lastError=null;break;}catch(error){lastError=error;}
    }
    if(lastError)throw lastError;
    enable.disabled=true;disable.disabled=false;note.textContent='Enabled. Look for JITO on this page. Refresh once for the earliest possible interception of file-picker clicks.';
  }catch(error){note.textContent='Could not enable on this page: '+error.message;}
});
disable.addEventListener('click',async()=>{
  try{
    await chrome.scripting.unregisterContentScripts({ids:[registrationId]});
    for(const t of await chrome.tabs.query({url:pattern}))try{await chrome.tabs.sendMessage(t.id,{type:'jito-disable'});}catch{}
    enable.disabled=false;disable.disabled=true;
    try{
      const removed=await chrome.permissions.remove({origins:[pattern]});
      note.textContent=removed?'Disabled for this site. Its normal uploads now run without JITO.':'Disabled for this site. Review retained site access in the browser extension settings.';
    }catch{note.textContent='Disabled for this site. Browser permission could not be removed automatically; review extension site access in browser settings.';}
  }catch(error){note.textContent=error.message;}
});

