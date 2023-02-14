/**
 * A quick test for memory leakage.
 * Run as "npm run test:memory".
 * Reports a loop count and a free memory number. If the free memory
 * number drops precipitously, uh-oh. Memory reported is for full system,
 * so don't do too much in background while this runs.
 */

const sqlite3 = require('../..');
const util = require('util');
const os = require('os');

async function run() {
  const db = new sqlite3.Database(':memory:');
  const run = util.promisify(db.run.bind(db));
  const fetch = util.promisify(db.allMarshal.bind(db));
  console.log('Creating table');
  await run('CREATE TABLE foo (row text, blb blob)');
  for (let i = 0; i < 10000; i++) {
    await run('INSERT INTO foo VALUES(?, ?)',
              'row ' + i, 'g\x00\x00\xc0\xff\xff\xff\xdfA');
  }
  console.log('Running queries');
  for (let i = 0; i < 100000; i++) {
    if (i % 1000 === 0) {
      console.log(String(i).padStart(20), String(os.freemem()).padStart(20));
    }
    await fetch('SELECT * FROM foo');
  }
}

run().catch(e => console.log(e));
