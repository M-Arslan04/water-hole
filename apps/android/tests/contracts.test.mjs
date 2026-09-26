import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
test('native interstitial frequency policy executes on JVM',()=>{
 const out=mkdtempSync(path.join(tmpdir(),'water-hole-ad-policy-'));
 execFileSync('javac',['-d',out,'android/app/src/main/java/com/example/waterhole/AdBreakPolicy.java','tests/AdBreakPolicyCheck.java']);
 console.log(execFileSync('java',['-cp',out,'com.example.waterhole.AdBreakPolicyCheck'],{encoding:'utf8'}));
});
test('web production assets have no native or advertising boundary',()=>{
 const root='../../dist/assets';
 const code=readdirSync(root).filter(f=>f.endsWith('.js')).map(f=>readFileSync(`${root}/${f}`,'utf8')).join('\n');
 for(const token of ['WaterHoleAds','Ad privacy choices','ca-app-pub-','Capacitor','requestConsentInfoUpdate']) assert.ok(!code.includes(token),token);
});
test('Android sync contains local assets and no remote game URL',()=>{
 const config=JSON.parse(readFileSync('android/app/src/main/assets/capacitor.config.json','utf8'));
 assert.equal(config.server?.url,undefined); assert.equal(config.appId,'com.example.waterhole');
 assert.equal(readFileSync('dist/index.html','utf8'),readFileSync('android/app/src/main/assets/public/index.html','utf8'));
 for(const name of readdirSync('dist/assets')) assert.deepEqual(readFileSync(`dist/assets/${name}`),readFileSync(`android/app/src/main/assets/public/assets/${name}`));
});
test('CLI xcode parser still generates UUIDs with patched dependency',()=>{
 const result=execFileSync(process.execPath,['-e',"const xcode=require('xcode');const p=xcode.project('unused');p.hash={project:{objects:{}}};if(!/^[A-F0-9]{24}$/.test(p.generateUuid()))process.exit(1)"],{encoding:'utf8'}); assert.equal(result,'');
});
