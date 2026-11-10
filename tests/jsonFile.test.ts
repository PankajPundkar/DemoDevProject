import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, setupTestEnv } from './helpers';

const dataDir = setupTestEnv();

after(() => cleanup(dataDir));

describe('JsonFile', () => {
  it('creates the file with defaults when missing', async () => {
    const { JsonFile } = await import('../src/utils/jsonFile');
    const file = new JsonFile(path.join(dataDir, 'nested', 'new.json'), () => ({ items: [] as number[] }));
    assert.deepEqual(await file.read(), { items: [] });
    assert.ok(fs.existsSync(path.join(dataDir, 'nested', 'new.json')));
  });

  it('serialises concurrent updates without losing writes', async () => {
    const { JsonFile } = await import('../src/utils/jsonFile');
    const file = new JsonFile(path.join(dataDir, 'counter.json'), () => ({ n: 0 }));
    await Promise.all(Array.from({ length: 50 }, () => file.update((d) => { d.n += 1; })));
    assert.equal((await file.read()).n, 50);
  });

  it('refuses to overwrite a corrupt file', async () => {
    const { JsonFile, JsonFileError } = await import('../src/utils/jsonFile');
    const p = path.join(dataDir, 'corrupt.json');
    fs.writeFileSync(p, '{ not json');
    const file = new JsonFile(p, () => ({}));
    await assert.rejects(file.read(), JsonFileError);
    assert.equal(fs.readFileSync(p, 'utf8'), '{ not json');
  });

  it('leaves no temp files behind', () => {
    const leftovers = fs.readdirSync(dataDir).filter((f) => f.endsWith('.tmp'));
    assert.deepEqual(leftovers, []);
  });
});

describe('userRepository', () => {
  it('allows only one of many simultaneous registrations with the same email', async () => {
    const { userRepository } = await import('../src/models/userRepository');
    const attempts = Array.from({ length: 10 }, (_, i) =>
      userRepository.create({ fullName: `User ${i}`, email: 'Same@Example.com', passwordHash: 'x' }),
    );
    const results = await Promise.allSettled(attempts);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter((r) => r.status === 'rejected').length, 9);
  });
});
