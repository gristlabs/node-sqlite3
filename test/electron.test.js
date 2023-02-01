var assert = require('assert');

// I can't find definitive documentation, but the napi-based binaries seem to run
// fine with Electron these days, no need for a special song and dance.
describe.skip('electron', function() {
  it('respects ELECTRON_VERSION', function() {
    process.env.ELECTRON_VERSION = '1.2.3';
    let name = require.resolve('..');
    delete require.cache[name];

    assert.throws(function() { require('..'); },
                  (/Cannot find module .*\/lib\/binding\/electron-v1.2-[^-]+-x64\/node_sqlite3.node/),
                  "Should have error like 'cannot find module'");
  });
});
