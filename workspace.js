'use strict';
const $ = id => document.getElementById(id);
let current=null, selected=new Set(), imageURL=null, generation=0, busy=false;
const downloadURLs=new Set();
const HISTORY_KEY='jito-local-review-history';
function historyItems(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch{return[]}}
function renderHistory(){const root=$('history-list');if(!root)return;const items=historyItems();root.replaceChildren();if(!items.length){root.append(element('p','No local review history yet.','note'));return;}items.slice(0,8).forEach(item=>{const row=element('div',undefined,'history-row');const main=element('div');main.append(element('strong',item.name),element('small',`${item.kind} · ${item.result} · ${new Date(item.time).toLocaleString()}`));row.append(main,element('span',item.result==='Safe'?'SAFE':'REVIEW','history-badge '+(item.result==='Safe'?'safe':'risk')));root.append(row);});}
function saveHistory(file,result){const items=historyItems().filter(item=>item.name!==file.name||Date.now()-item.time>1000);items.unshift({name:file.name,kind:result.kind==='image'?result.format:'Text',result:result.findings.length?'Review needed':'Safe',time:Date.now()});try{localStorage.setItem(HISTORY_KEY,JSON.stringify(items.slice(0,25)))}catch{}renderHistory();}
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);$('status').classList.toggle('safe',!error&&/safe|no supported|ready/i.test(message));$('status').classList.toggle('risk',!error&&/finding|metadata|redact|sensitive/i.test(message));}
function reset(){generation++; current=null;selected.clear();busy=false;if(imageURL)URL.revokeObjectURL(imageURL);imageURL=null;for(const url of downloadURLs)URL.revokeObjectURL(url);downloadURLs.clear();$('preview-img').removeAttribute('src');$('text-preview').textContent='';$('filename').textContent='';$('filemeta').textContent='';$('findings').replaceChildren();$('file').value='';$('review').hidden=true;$('drop').hidden=false;$('clear').disabled=true;$('ack').checked=false;$('reveal').checked=false;$('output-name').value='jito-sharing-copy';status('');}
function update(){
  if(!current)return;
  $('ack').checked=false;
  if(current.kind==='text'){
    $('text-preview').textContent=$('reveal').checked?current.text:Jito.redact(current.text,current.findings,selected);
    $('preview-note').textContent=$('reveal').checked?'Original text is visible here. The downloaded copy still uses your selected redactions.':`${selected.size} of ${current.findings.length} findings selected for redaction. Unselected content remains. Exported as plain text, not a spreadsheet.`;
  }
  buttonState();
}
function buttonState(){ $('clear').disabled=busy||!current||(window.JitoHandoff&&!window.JitoHandoff.available());$('download').disabled=!current||busy||!$('ack').checked||(current.kind==='image'&&!$('strip').checked)||!$('output-name').value.trim()||(window.JitoHandoff&&!window.JitoHandoff.available()); }
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
async function openFile(file){
  reset();const token=generation;busy=true;$('clear').disabled=false;status('Inspecting locally…');
  try{
    if(file.size>Jito.MAX_IMAGE)throw new Error('File exceeds the 15 MB limit.');
    const bytes=new Uint8Array(await file.arrayBuffer());if(token!==generation)return;
    const result=Jito.inspect(bytes,file.name);
    if(result.kind==='image'){
      const url=URL.createObjectURL(new Blob([bytes],{type:result.mime}));imageURL=url;
      const image=new Image();image.src=url;
      await image.decode();if(token!==generation)return;
      Jito.dimensions(image.naturalWidth,image.naturalHeight);result.image=image;
      $('preview-img').src=url;
    }
    current=result;saveHistory(file,result);selected=new Set(result.findings.map(f=>f.id));
    $('filename').textContent=file.name;$('filemeta').textContent=`${(file.size/1024).toFixed(1)} KB · ${result.format}${result.kind==='image'?` · ${result.image.naturalWidth} × ${result.image.naturalHeight} px`:''}`;
    $('kind').textContent=result.kind==='image'?'IMAGE':'TEXT';$('count').textContent=`${result.findings.length} found`;
    $('guidance').textContent=result.kind==='image'?'These are embedded data blocks, not confirmed personal details. Export removes all source metadata together, including any blocks not listed here.':'Select what to redact. Values are masked in this list; use “Show original text” to inspect them. Detectors cover a limited set of patterns.';
    if(!result.findings.length)$('findings').append(element('p','No supported patterns or metadata blocks were detected. This does not mean the file is free of sensitive information.','note'));
    result.findings.forEach(f=>{
      if(result.kind==='image'){
        const row=element('div',undefined,'metadata');row.append(element('strong',f.label),element('small',f.detail));$('findings').append(row);
      }else{
        const row=element('label',undefined,'choice'),box=document.createElement('input');box.type='checkbox';box.checked=true;
        box.addEventListener('change',()=>{box.checked?selected.add(f.id):selected.delete(f.id);update();});
        const info=element('span');info.append(element('strong',f.label),element('small',`Match ${f.id+1} · character ${f.start+1} · ${f.length} characters · value hidden`));row.append(box,info);$('findings').append(row);
      }
    });
    const isImage=result.kind==='image';$('image-choice').hidden=!isImage;$('image-preview').hidden=!isImage;$('text-preview').hidden=isImage;$('reveal-wrap').hidden=isImage;$('strip').checked=true;$('extension').textContent=isImage?'.png':'.txt';
    if(isImage)$('preview-note').textContent='Visible faces, names, screenshots, watermarks, and text in the pixels remain. This is not an OCR or steganography scan. Inspect the saved image before sharing; color and size may change.';
    $('drop').hidden=true;$('review').hidden=false;busy=false;status('Review ready. Nothing has been uploaded.');update();
  }catch(error){if(token!==generation)return;reset();status(error.message,true);}
}
$('file').addEventListener('change',e=>{if(e.target.files[0])openFile(e.target.files[0]);});
$('demo').addEventListener('click',()=>openFile(new File(['JITO - fictional privacy test\n\nProject: Community garden\nContact: alex@example.com\nTest card: 4111 1111 1111 1111\nSynthetic US SSN: 123-45-6789\nFake token: sk-proj-abcdefghijklmnopqrstuvwxyz123456\n\nKeep this: planting begins next Saturday.\n'],'fictional-sample.txt',{type:'text/plain'})));
$('clear').addEventListener('click',reset);$('reveal').addEventListener('change',update);$('strip').addEventListener('change',update);$('ack').addEventListener('change',buttonState);$('output-name').addEventListener('input',()=>{$('ack').checked=false;buttonState();});
for(const event of ['dragenter','dragover'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.add('dragging');});
$('drop').addEventListener('dragleave',()=>$('drop').classList.remove('dragging'));
document.addEventListener('dragover',e=>e.preventDefault());
document.addEventListener('drop',e=>{e.preventDefault();$('drop').classList.remove('dragging');if(e.dataTransfer.files.length!==1){status('Choose one file at a time.',true);return;}openFile(e.dataTransfer.files[0]);});
$('download').addEventListener('click',async()=>{
  if($('download').disabled)return;
  const token=generation, snapshot=current;busy=true;buttonState();status('Preparing your sharing copy locally…');
  try{
    let blob;
    if(snapshot.kind==='text')blob=new Blob([Jito.redact(snapshot.text,snapshot.findings,selected)],{type:'text/plain;charset=utf-8'});
    else{
      const canvas=document.createElement('canvas');canvas.width=snapshot.image.naturalWidth;canvas.height=snapshot.image.naturalHeight;
      const context=canvas.getContext('2d');if(!context)throw new Error('Image rendering is unavailable in this browser.');
      context.drawImage(snapshot.image,0,0);blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));canvas.width=canvas.height=0;
      if(!blob)throw new Error('Could not create an image copy. No download was started.');
      // Browser encoder output is checked independently of input inspection limits.
      const output=await blob.arrayBuffer();
      if(output.byteLength>Jito.MAX_IMAGE)throw new Error('The rendered PNG exceeds 15 MB. Resize the original locally and try again.');
      const check=Jito.inspect(new Uint8Array(output),'output.png');
      if(check.findings.length)throw new Error('Unexpected metadata in generated image. No download was started.');
    }
    if(token!==generation)return;
  if(window.JitoHandoff){status(await window.JitoHandoff.send(blob));window.JitoHandoff.closeAfterSuccess?.();return;}
    const base=$('output-name').value.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/[. ]+$/g,'').slice(0,100)||'jito-sharing-copy';
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');downloadURLs.add(url);anchor.href=url;anchor.download=base+(snapshot.kind==='image'?'.png':'.txt');anchor.click();setTimeout(()=>{URL.revokeObjectURL(url);downloadURLs.delete(url);},60000);
    status('Download requested. Check your Downloads folder, review the saved copy, then upload that copy to your destination.');
  }catch(error){if(token===generation)status(error.message,true);}finally{if(token===generation){busy=false;buttonState();}}
});
window.addEventListener('pagehide',reset);
$('clear-history')?.addEventListener('click',()=>{localStorage.removeItem(HISTORY_KEY);renderHistory();});
renderHistory();





