/* Development integration test. Browser requests are fulfilled locally: no
   synthetic test data is sent to ChatGPT. This is NOT a live SaaS acceptance test. */
const {chromium}=require(process.env.JITO_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const dir=process.env.JITO_TEST_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'jito-tests-'));
fs.mkdirSync(dir,{recursive:true});
const source=path.resolve(__dirname,'..'),extension=path.join(dir,'extension');
fs.cpSync(source,extension,{recursive:true});
// Test-only grants avoid an unautomatable headless permission prompt. Shipped
// manifest retains OPTIONAL site permissions; no live service receives data.
const manifest=JSON.parse(fs.readFileSync(path.join(extension,'manifest.json')));
manifest.host_permissions=['https://upload-a.test/*','https://upload-b.test/*'];
fs.writeFileSync(path.join(extension,'manifest.json'),JSON.stringify(manifest));
const fixture=`<!doctype html><html><head><title>JITO adapter test — local fixture, NOT live ChatGPT</title></head><body style="background:#212121;color:white;font:18px system-ui;padding:50px"><h1>Upload adapter test fixture</h1><p>This controlled test page is not the ChatGPT service.</p><form><textarea id="prompt-textarea" aria-label="Message"></textarea><input type="file" id="target" hidden></form><output id="received"></output><script>window.received=[];document.addEventListener('change',async e=>{if(e.target.type==='file'){const f=e.target.files[0];if(!f)return;const bytes=Array.from(new Uint8Array(await f.arrayBuffer()));received.push({name:f.name,type:f.type,bytes});document.getElementById('received').textContent='Attachment received: '+f.name;fetch('/__jito_test_sink',{method:'POST',body:JSON.stringify(received.at(-1))});}});</script></body></html>`;
(async()=>{
 const context=await chromium.launchPersistentContext(fs.mkdtempSync(path.join(dir,'profile-')),{headless:true,executablePath:process.env.JITO_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-unsafe-extension-debugging'],ignoreDefaultArgs:['--disable-extensions'],viewport:{width:1280,height:1000}});
 try{
  const browser=context.browser(),cdp=await browser.newBrowserCDPSession();const loaded=await cdp.send('Extensions.loadUnpacked',{path:extension});
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
  await worker.evaluate(async()=>{const old=await chrome.scripting.getRegisteredContentScripts();if(old.length)await chrome.scripting.unregisterContentScripts({ids:old.map(s=>s.id)});});
  const page=await context.newPage();const requests=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route(/^https:\/\/upload-[ab]\.test\//,route=>{if(route.request().url().endsWith('/__jito_test_sink')){requests.push(JSON.parse(route.request().postData()));return route.fulfill({body:'OK'});}return route.fulfill({contentType:'text/html',body:fixture});});
  await page.goto('https://upload-a.test/');assert.equal(await page.locator('#jito-extension-host').count(),0);
  await worker.evaluate(()=>chrome.scripting.registerContentScripts([{id:'test-sites',matches:['https://upload-a.test/*','https://upload-b.test/*'],js:['site.js'],runAt:'document_start',persistAcrossSessions:true}]));
  await page.reload();
  const launcher=page.getByRole('button',{name:'JITO · Review & attach'});
  const review=page.frameLocator('iframe[title="JITO private file review"]');
  const sample=Buffer.from('Private email: fictional@example.com\nKeep: ready for review.');
  async function start(){await launcher.click();await review.locator('#status').filter({hasText:'Connected to https://'}).waitFor();}
  async function choose(){await review.locator('#file').setInputFiles({name:'original-private.txt',mimeType:'text/plain',buffer:sample});await review.locator('#review').waitFor({state:'visible'});}
  async function approve(){await review.locator('#ack').check();await review.locator('#download').click();}
  await start();await choose();assert.equal(requests.length,0);assert.equal(await page.evaluate(()=>received.length),0);
  assert.equal(await page.locator('iframe').evaluate(e=>e.contentDocument===null),true);
  assert.equal(await review.locator('#download').isDisabled(),true);
  await approve();await review.locator('#status').filter({hasText:'Cleaned copy handed'}).waitFor();
  await page.waitForFunction(()=>received.length===1);
  assert.equal(requests.length,1);assert.equal(requests[0].name,'jito-sharing-copy.txt');assert.equal(Buffer.from(requests[0].bytes).toString(),'Private email: [REDACTED]\nKeep: ready for review.');assert.equal(await review.locator('#download').isDisabled(),true);
  await page.screenshot({path:path.join(dir,'handoff.png'),fullPage:true});
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await start();await choose();await page.getByRole('button',{name:'Close',exact:true}).click();assert.equal(requests.length,1);
  await start();await review.locator('#file').setInputFiles({name:'unsupported.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7')});await review.locator('#status.error').waitFor();assert.equal(requests.length,1);await page.getByRole('button',{name:'Close',exact:true}).click();
  // Site navigation after review must not deliver to a different conversation.
  await start();await choose();await page.evaluate(()=>history.pushState({},'', '/c/different-chat'));await approve();await review.locator('#status.error').filter({hasText:'page or review session changed'}).waitFor();assert.equal(requests.length,1);await page.getByRole('button',{name:'Close',exact:true}).click();
  // Reject ambiguous upload targets instead of guessing.
  await page.evaluate(()=>{const clone=document.getElementById('target').cloneNode();clone.id='second';document.querySelector('form').append(clone);});
  await start();await choose();await approve();await review.locator('#status.error').filter({hasText:'one compatible'}).waitFor();assert.equal(requests.length,1);await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.evaluate(()=>document.getElementById('second').remove());
  // Replace the input while the dialog is open, as a SPA can do.
  await start();await choose();await page.evaluate(()=>{const old=document.getElementById('target');old.replaceWith(old.cloneNode());});await approve();await review.locator('#status').filter({hasText:'Cleaned copy handed'}).waitFor();await page.waitForFunction(()=>received.length===2);assert.equal(requests.length,2);
  await page.getByRole('button',{name:'Close',exact:true}).click();
  // Real image encoding, metadata removal, then a page-level upload event.
  const raw=await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=10;c.height=10;const x=c.getContext('2d');x.fillStyle='red';x.fillRect(0,0,10,10);return [...new Uint8Array(await(await new Promise(r=>c.toBlob(r))).arrayBuffer())];});
  const J=require('../core.js'),payload=Buffer.from('Author\0Fictional Person'),type=Buffer.from('tEXt'),n=Buffer.alloc(4),crc=Buffer.alloc(4);n.writeUInt32BE(payload.length);crc.writeUInt32BE(J.crc32(Buffer.concat([type,payload])));
  const tagged=Buffer.concat([Buffer.from(raw).subarray(0,33),n,type,payload,crc,Buffer.from(raw).subarray(33)]);
  await start();await review.locator('#file').setInputFiles({name:'private.png',mimeType:'image/png',buffer:tagged});await review.locator('#review').waitFor({state:'visible'});assert.equal(requests.length,2);await approve();await review.locator('#status').filter({hasText:'Cleaned copy handed'}).waitFor();await page.waitForFunction(()=>received.length===3);assert.equal(J.inspect(Buffer.from(requests[2].bytes),'out.png').findings.length,0);assert.ok(!Buffer.from(requests[2].bytes).includes(Buffer.from('Fictional Person')));
  await page.getByRole('button',{name:'Close',exact:true}).click();
  // Standard native input click is stopped BEFORE its default file chooser.
  await page.evaluate(()=>{const input=document.getElementById('target');input.hidden=false;const second=input.cloneNode();second.id='second';input.after(second);});
  await page.locator('#second').click();await review.locator('#status').filter({hasText:'Connected to https://'}).waitFor();await choose();assert.equal(requests.length,3);await approve();await review.locator('#status').filter({hasText:'Cleaned copy handed'}).waitFor();await page.waitForFunction(()=>received.length===4);assert.equal(await page.locator('#second').evaluate(e=>e.files[0].name),'jito-sharing-copy.txt');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  // A second independent SaaS-like origin uses the exact same adapter.
  await page.goto('https://upload-b.test/');await page.evaluate(()=>document.getElementById('target').hidden=false);await page.locator('#target').click();await review.locator('#status').filter({hasText:'Connected to https://upload-b.test'}).waitFor();await choose();await approve();await review.locator('#status').filter({hasText:'Cleaned copy handed'}).waitFor();await page.waitForFunction(()=>received.length===1);assert.equal(requests.length,5);
  await page.getByRole('button',{name:'Close',exact:true}).click();
  // Disabling removes the launcher and the click interception from live tabs.
  await worker.evaluate(async()=>{const tabs=await chrome.tabs.query({url:'https://upload-b.test/*'});for(const tab of tabs)await chrome.tabs.sendMessage(tab.id,{type:'jito-disable'});});
  assert.equal(await page.locator('#jito-extension-host').count(),0);
  await worker.evaluate(()=>chrome.scripting.unregisterContentScripts({ids:['test-sites']}));
  const popup=await context.newPage();await page.bringToFront();await popup.goto(`chrome-extension://${loaded.id}/popup.html`);
  await popup.locator('#site-name').filter({hasText:'upload-b.test'}).waitFor();await popup.locator('#enable-site').click();await page.locator('#jito-extension-host').waitFor({state:'attached'});
  await popup.locator('#site-status').filter({hasText:'Enabled. Look for JITO'}).waitFor();await popup.screenshot({path:path.join(dir,'popup.png')});
  await popup.locator('#disable-site').click();await popup.locator('#site-status').filter({hasText:'Disabled for this site'}).waitFor();assert.equal(await page.locator('#jito-extension-host').count(),0);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:['disabled sites have no injection','enabled sites auto-inject button','cross-origin review frame hides file from host','no upload before approval','redacted bytes reach page and intercepted network sink','neutral filename','one-shot handoff','cancel sends nothing','unsupported format sends nothing','changed page rejected','ambiguous input rejected','SPA input replacement handled','image metadata removed before handoff','native file-picker click opens JITO before selection','clicked input retained among multiple controls','same adapter on two origins','disable removes live interception','popup enable registers and injects','popup disable unregisters and removes','no page errors'],liveSaaSVerified:false,permissionPromptVerified:false,artifacts:dir},null,2));
 }finally{await context.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

