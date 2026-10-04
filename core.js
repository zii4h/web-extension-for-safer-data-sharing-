/* Pure local inspection helpers; shared by the browser and Node tests. */
(function(root) {
  'use strict';
  const MAX_IMAGE = 15 * 1024 * 1024, MAX_TEXT = 2 * 1024 * 1024;
  function fail(message) { throw new Error(message); }
  const ascii = (b, start, end) => String.fromCharCode(...b.subarray(start, end));
  function luhn(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19 || /^(\d)\1+$/.test(digits)) return false;
    let sum = 0, double = false;
    for (let i = digits.length - 1; i >= 0; i--) { let n = +digits[i]; if (double && (n *= 2) > 9) n -= 9; sum += n; double = !double; }
    return sum % 10 === 0;
  }
  function scanText(text) {
    const found = [];
    const add = (regex, label, test = () => true) => {
      for (const match of text.matchAll(regex)) {
        if (test(match[0])) found.push({ start: match.index, end: match.index + match[0].length, label, length: match[0].length });
        if (found.length > 1000) fail('More than 1,000 findings. Split this text into smaller files for review.');
      }
    };
    add(/\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16})\b/g, 'Possible secret token');
    add(/\b[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+\b/gi, 'Email address');
    add(/(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)/g, 'Possible US Social Security number', s => !/^(000|666|9\d\d)-/.test(s) && s.slice(4,6) !== '00' && s.slice(7) !== '0000');
    add(/(?<!\d)\d(?:[ -]?\d){12,18}(?![ -]?\d)/g, 'Possible payment-card number', luhn);
    // Resolve overlaps deterministically; offsets always refer to the original text.
    found.sort((a,b) => a.start - b.start || b.end - a.end);
    const result = [];
    for (const f of found) if (!result.length || f.start >= result[result.length - 1].end) result.push({ ...f, id: result.length });
    return result;
  }
  function redact(text, findings, selected) {
    let output = text;
    for (const f of [...findings].sort((a,b) => b.start - a.start)) if (selected.has(f.id)) output = output.slice(0,f.start) + '[REDACTED]' + output.slice(f.end);
    return output;
  }
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const b of bytes) { crc ^= b; for (let j=0;j<8;j++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function dimensions(width,height) {
    if (!width || !height || width > 10000 || height > 10000 || width * height > 20000000) fail('Image exceeds the limit of 20 megapixels or 10,000 pixels per side. Resize it locally first.');
  }
  function png(b) {
    const view = new DataView(b.buffer,b.byteOffset,b.byteLength), findings = [];
    let p=8, width=0, height=0, end=false, data=false, chunks=0;
    const keep = new Set(['IHDR','PLTE','IDAT','IEND','tRNS','gAMA','cHRM','sRGB','sBIT','pHYs']);
    while (p < b.length) {
      if (p+12 > b.length) fail('Truncated PNG chunk.');
      const length=view.getUint32(p), type=ascii(b,p+4,p+8), next=p+12+length;
      if (next>b.length || !/^[A-Za-z]{4}$/.test(type)) fail('Invalid PNG structure.');
      if (crc32(b.subarray(p+4,p+8+length)) !== view.getUint32(p+8+length)) fail('PNG integrity check failed.');
      if (chunks++ === 0 && type !== 'IHDR') fail('PNG header is missing.');
      if (chunks > 10000 || findings.length > 1000) fail('Image structure is too complex for this release. Re-export it locally first.');
      if (type==='IHDR') { if (width || length!==13) fail('Invalid PNG header.'); width=view.getUint32(p+8);height=view.getUint32(p+12);dimensions(width,height); }
      if (['acTL','fcTL','fdAT'].includes(type)) fail('Animated PNG is not supported. Export a static frame first.');
      if (type==='IDAT') data=true;
      if (!keep.has(type)) {
        let label='Additional image data', detail=`${type} block · ${length.toLocaleString()} bytes`;
        if(type==='eXIf'){label='EXIF metadata';detail+=' · may include GPS/location, camera/device, date/time, orientation, and capture settings';}
        else if(['tEXt','iTXt','zTXt'].includes(type)){label='Embedded text metadata';detail+=' · may include author, title, description, software, or comments';}
        else if(type==='iCCP'){label='Embedded color profile';detail+=' · display/colour profile';}
        findings.push({label,detail});
      }
      p=next;
      if (type==='IEND') { if(length || !data) fail('Invalid PNG ending.'); end=true;break; }
    }
    if (!end) fail('PNG ending is missing.');
    if(p<b.length) findings.push({label:'Data after image ending',detail:`${b.length-p} trailing bytes`});
    return {kind:'image',format:'PNG',mime:'image/png',width,height,findings};
  }
  function jpeg(b) {
    let p=2,width=0,height=0,ended=false,hasScan=false,segments=0;const findings=[];
    while(p<b.length) {
      if (++segments>10000 || findings.length>1000) fail('Image structure is too complex for this release. Re-export it locally first.');
      if(b[p++]!==0xff) fail('Invalid JPEG marker.');
      while(b[p]===0xff) p++;
      const marker=b[p++];
      if(marker===0xd9) { ended=true;break; }
      if(marker===0x00 || marker===0xd8 || (marker>=0xd0&&marker<=0xd7)) fail('Unexpected JPEG marker.');
      if(marker===0x01) continue;
      if(p+2>b.length) fail('Truncated JPEG.');
      const length=b[p]*256+b[p+1],next=p+length;
      if(length<2 || next>b.length) fail('Truncated JPEG segment.');
      if([0xc0,0xc1,0xc2].includes(marker)) {if(length<8) fail('Invalid JPEG dimensions.');height=b[p+3]*256+b[p+4];width=b[p+5]*256+b[p+6];dimensions(width,height);}
      if((marker>=0xe0&&marker<=0xef)||marker===0xfe) {
        const prefix=ascii(b,p+2,Math.min(next,p+35));
        if(marker===0xfe || marker!==0xe0 && marker!==0xee || (marker===0xe0 && length>16)) {let label=marker===0xfe?'JPEG comment':prefix.startsWith('Exif')?'EXIF metadata':prefix.includes('ns.adobe.com')?'XMP metadata':prefix.startsWith('ICC_PROFILE')?'Embedded color profile':'Application metadata';let detail=`${marker===0xfe?'COM':'APP'+(marker-0xe0)} block · ${length-2} bytes`;if(label==='EXIF metadata')detail+=' · may include GPS/location, camera/device, date/time, orientation, and capture settings';if(label==='XMP metadata')detail+=' · may include author, title, software, edits, or location';if(label==='JPEG comment')detail+=' · free-form embedded comment';findings.push({label,detail});}
      }
      p=next;
      if(marker===0xda) {
        hasScan=true;
        while(p<b.length) {
          if(b[p]!==0xff) {p++;continue;}
          const start=p;while(b[p]===0xff) p++;
          if(b[p]===0 || (b[p]>=0xd0&&b[p]<=0xd7)) {p++;continue;}
          p=start;break;
        }
      }
    }
    if(!ended||!width||!height||!hasScan) fail('Unsupported or incomplete JPEG.');
    if(p<b.length) findings.push({label:'Data after image ending',detail:`${b.length-p} trailing bytes`});
    return {kind:'image',format:'JPEG',mime:'image/jpeg',width,height,findings};
  }
  function inspect(bytes,name) {
    const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
    if(!b.length) fail('This file is empty. Choose a file with content.');
    if(b.length>MAX_IMAGE) fail('File exceeds the 15 MB limit.');
    if(b.length>=8 && [137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)) return png(b);
    if(b[0]===0xff&&b[1]===0xd8) return jpeg(b);
    if(!/\.(txt|md|csv|log)$/i.test(name)) fail('Unsupported file. Choose a JPEG, static PNG, or UTF-8 TXT, MD, CSV, or LOG file. PDF and Office files are not supported.');
    if(b.length>MAX_TEXT) fail('Text exceeds the 2 MB limit.');
    let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(b);}catch{fail('This text is not valid UTF-8. Convert its encoding locally first.');}
    if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) fail('Binary or unsupported control characters found. This cannot be reviewed as plain text.');
    return {kind:'text',format:'UTF-8 text',mime:'text/plain',text,findings:scanText(text)};
  }
  root.Jito={inspect,scanText,redact,luhn,crc32,dimensions,MAX_IMAGE,MAX_TEXT};
  if(typeof module!=='undefined') module.exports=root.Jito;
})(globalThis);

