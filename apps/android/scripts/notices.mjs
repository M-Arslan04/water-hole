import {readFile,writeFile} from 'node:fs/promises';
const names=['core','android','app','preferences'];
const notices=await Promise.all(names.map(async name=>`@capacitor/${name}\n${await readFile(`node_modules/@capacitor/${name}/LICENSE`,'utf8')}`));
await writeFile('dist/native-licenses.txt',notices.join('\n\n')+'\n\nGoogle Mobile Ads and UMP are distributed under Google SDK terms. Inspect the resolved native dependency notices before release.\n');
