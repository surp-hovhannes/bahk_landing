import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire, findPackageJSON } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from 'vitest';

// Exercise the bundler Netlify dev actually loads, including nested dependencies.
const require = createRequire(import.meta.url);
const adapter = createRequire(require.resolve('@astrojs/netlify'));
const plugin = createRequire(adapter.resolve('@netlify/vite-plugin'));
const functions = createRequire(findPackageJSON('@netlify/functions-dev', pathToFileURL(plugin.resolve('@netlify/dev')).href));
const { zipFunctions } = await import(pathToFileURL(functions.resolve('@netlify/zip-it-and-ship-it')).href);
const bundler = createRequire(functions.resolve('@netlify/zip-it-and-ship-it'));
const { nodeFileTrace } = await import(pathToFileURL(bundler.resolve('@vercel/nft')).href);

test.each(['nft', 'zisi', 'esbuild'])('Netlify %s bundles executable functions with include/exclude patterns', async nodeBundler => {
  const directory = await mkdtemp(join(tmpdir(), 'landing-netlify-bundle-'));
  try {
    const source = join(directory, 'functions');
    await mkdir(source);
    await mkdir(join(directory, 'assets', 'nested'), { recursive: true });
    await writeFile(join(source, 'hello.cjs'), `
      const { readFileSync } = require('node:fs');
      const { join } = require('node:path');
      exports.handler = async () => ({
        statusCode: 200,
        body: readFileSync(join(process.cwd(), 'assets/nested/message.txt'), 'utf8')
      });
    `);
    await writeFile(join(directory, 'assets/nested/message.txt'), 'packaged asset');
    await writeFile(join(directory, 'assets/nested/private.txt'), 'exclude this file');
    await writeFile(join(directory, 'assets/nested/unrelated.json'), '{}');
    const [result] = await zipFunctions(source, join(directory, 'output'), {
      basePath: directory,
      repositoryRoot: directory,
      config: {
        '*': { nodeBundler, nodeVersion: '22.x' },
        'hel*': { includedFiles: ['assets/**/*.txt', '!assets/**/private.txt'] },
      },
    });
    expect(result.name).toBe('hello');
    const listing = execFileSync('unzip', ['-Z1', result.path], { encoding: 'utf8' });
    expect(listing).toContain('assets/nested/message.txt');
    expect(listing).not.toContain('private.txt');
    expect(listing).not.toContain('unrelated.json');
    const extracted = join(directory, 'extracted');
    await mkdir(extracted);
    execFileSync('unzip', ['-q', result.path, '-d', extracted]);
    // Execute in an isolated working directory so missing packaged files cannot
    // be satisfied by the source tree or an ambient node_modules directory.
    const response = execFileSync(process.execPath, ['--input-type=commonjs', '-e', `
      require('./hello.js').handler().then(result => process.stdout.write(JSON.stringify(result)));
    `], { cwd: extracted, encoding: 'utf8', timeout: 10_000 });
    expect(JSON.parse(response)).toEqual({ statusCode: 200, body: 'packaged asset' });
    expect(await readFile(join(extracted, 'assets/nested/message.txt'), 'utf8')).toBe('packaged asset');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Netlify NFT traces dynamic filesystem assets through its Glob consumer', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'landing-netlify-trace-'));
  try {
    await mkdir(join(directory, 'messages'));
    await writeFile(join(directory, 'entry.cjs'), `
      const fs = require('node:fs');
      const path = require('node:path');
      fs.readFileSync(path.join(__dirname, 'messages', process.env.MESSAGE + '.json'));
    `);
    await writeFile(join(directory, 'messages/one.json'), '{}');
    await writeFile(join(directory, 'messages/two.json'), '{}');
    await writeFile(join(directory, 'messages/unrelated.txt'), 'not a JSON asset');
    const result = await nodeFileTrace([join(directory, 'entry.cjs')], { base: directory });
    expect([...result.fileList]).toEqual(expect.arrayContaining(['entry.cjs', 'messages/one.json', 'messages/two.json']));
    expect([...result.fileList]).not.toContain('messages/unrelated.txt');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
