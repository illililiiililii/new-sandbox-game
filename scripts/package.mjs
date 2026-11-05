import { packager } from '@electron/packager';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const stagingRoot = path.join(root, '.packaging');
await fs.mkdir(stagingRoot, { recursive: true });
const stage = await fs.mkdtemp(path.join(stagingRoot, 'orbit-'));
for (const file of ['main.cjs', 'preload.cjs', 'forge-server.mjs', 'package.json', 'README.md', 'DESIGN.md', 'DESIGN-LICENSE', 'THREE-LICENSE', 'WS-LICENSE']) {
  await fs.copyFile(path.join(root, file), path.join(stage, file));
}
await fs.cp(path.join(root, 'dist'), path.join(stage, 'dist'), { recursive: true });
await fs.mkdir(path.join(stage, 'node_modules'), { recursive: true });
await fs.cp(path.join(root, 'node_modules/ws'), path.join(stage, 'node_modules/ws'), { recursive: true });
const paths = await packager({
  dir: stage,
  out: path.join(root, 'release-builds'),
  name: 'ORBIT FOUNDRY',
  platform: 'win32',
  arch: 'x64',
  electronVersion: '45.2.3',
  asar: true,
  overwrite: true,
  prune: false,
  icon: path.join(root, 'assets/orbit.ico'),
  appCopyright: 'ORBIT FOUNDRY · 2026',
  win32metadata: { ProductName: 'ORBIT FOUNDRY', FileDescription: 'ORBIT FOUNDRY · 3D Sandbox' }
});
for (const directory of paths) await fs.copyFile(path.join(root, 'README.md'), path.join(directory, '시작하기.md'));
console.log(JSON.stringify(paths));
