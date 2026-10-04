const {test}=require('node:test');
const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const J=require('../core.js');
const text=s=>new TextEncoder().encode(s);
function chunk(type,data=Buffer.alloc(0)) {const n=Buffer.alloc(4);n.writeUInt32BE(data.length);const body=Buffer.concat([Buffer.from(type),data]),crc=Buffer.alloc(4);crc.writeUInt32BE(J.crc32(body));return Buffer.concat([n,body,crc]);}
function png(extra=[],width=1,height=1){const hdr=Buffer.alloc(13);hdr.writeUInt32BE(width);hdr.writeUInt32BE(height,4);hdr[8]=8;hdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),...extra,chunk('IDAT',zlib.deflateSync(Buffer.from([0,255,0,0,255]))),chunk('IEND')]);}
function segment(marker,data){return Buffer.concat([Buffer.from([255,marker,(data.length+2)>>8,(data.length+2)&255]),data]);}
function jpeg(extra=[]){return Buffer.concat([Buffer.from([255,216]),...extra,segment(0xc0,Buffer.from([8,0,1,0,1,1,1,17,0])),segment(0xda,Buffer.from([1,1,0,0,63,0])),Buffer.from([12,255,0,13,255,208,14,255,217])]);}
test('matches actual text, never filenames',()=>{assert.equal(J.inspect(text('Nothing sensitive here.'),'risky-employee-dump.txt').findings.length,0);assert.equal(J.inspect(text('a@example.com'),'safe.txt').findings.length,1);});
test('detects four supported patterns and masks them',()=>{const s='Email: alex@example.com\nCard: 4111 1111 1111 1111\nSSN: 123-45-6789\nToken: sk-proj-abcdefghijklmnopqrstuvwxyz123456\nKeep this';const f=J.scanText(s);assert.equal(f.length,4);const output=J.redact(s,f,new Set(f.map(x=>x.id)));assert.equal(output.match(/\[REDACTED\]/g).length,4);assert.ok(output.includes('Keep this'));assert.ok(!output.includes('example.com'));});
test('redacts selected occurrence only, preserving Unicode and newlines',()=>{const s='🌱 alex@example.com\r\nalex@example.com';const f=J.scanText(s);assert.equal(J.redact(s,f,new Set([0])),'🌱 [REDACTED]\r\nalex@example.com');assert.equal(J.redact(s,f,new Set()),s);});
test('rejects invalid card checksums and impossible SSNs',()=>{assert.equal(J.scanText('4111 1111 1111 1112 000-12-1234 666-12-1234 123-00-1234 123-12-0000').length,0);assert.equal(J.luhn('0000000000000000'),false);});
test('rejects binary, invalid UTF-8, empty files and unsupported formats',()=>{assert.throws(()=>J.inspect(text('%PDF-1.7'),'x.pdf'),/Unsupported/);assert.throws(()=>J.inspect(new Uint8Array([255,254,42]),'x.txt'),/UTF-8/);assert.throws(()=>J.inspect(new Uint8Array([0,1]),'x.txt'),/Binary/);assert.throws(()=>J.inspect(new Uint8Array(),'x.txt'),/empty/);});
test('text and image size limits are enforced',()=>{assert.throws(()=>J.inspect(new Uint8Array(J.MAX_TEXT+1).fill(65),'x.txt'),/2 MB/);assert.throws(()=>J.inspect(new Uint8Array(J.MAX_IMAGE+1),'x.png'),/15 MB/);});
test('recognizes PNG by signature and detects metadata and trailing bytes',()=>{const b=Buffer.concat([png([chunk('tEXt',Buffer.from('Author\0Fictional Person')),chunk('eXIf',Buffer.from('TEST'))]),Buffer.from('private trailer')]);const r=J.inspect(b,'wrong.jpg');assert.equal(r.format,'PNG');assert.equal(r.findings.length,3);assert.equal(r.width,1);});
test('PNG CRC errors and truncated files fail closed',()=>{const b=png();b[20]^=1;assert.throws(()=>J.inspect(b,'a.png'),/integrity/);assert.throws(()=>J.inspect(png().subarray(0,40),'a.png'),/Truncated/);});
test('animation and excessive image dimensions rejected before decode',()=>{assert.throws(()=>J.inspect(png([chunk('acTL',Buffer.alloc(8))]),'a.png'),/Animated/);assert.throws(()=>J.inspect(png([],10001,1),'a.png'),/megapixels/);});
test('JPEG EXIF and comments detected through stuffed bytes and restart markers',()=>{const r=J.inspect(jpeg([segment(0xe1,Buffer.from('Exif\0\0private')),segment(0xfe,Buffer.from('author'))]),'x.jpg');assert.equal(r.findings.length,2);assert.equal(r.format,'JPEG');});
test('JPEG metadata after scan and trailing bytes detected',()=>{const initial=jpeg();const b=Buffer.concat([initial.subarray(0,-2),segment(0xfe,Buffer.from('after scan')),Buffer.from([255,217]),Buffer.from('trailing')]);assert.equal(J.inspect(b,'x.jpg').findings.length,2);});
test('truncated JPEG and missing ending rejected',()=>{assert.throws(()=>J.inspect(jpeg().subarray(0,-2),'x.jpg'),/incomplete/);assert.throws(()=>J.inspect(new Uint8Array([255,216,255,225,255,255]),'x.jpg'),/Truncated/);});
test('finding cap prevents unreviewable export',()=>{assert.throws(()=>J.scanText('a@example.com\n'.repeat(1001)),/1,000/);});
module.exports={png,chunk};
