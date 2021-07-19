var sqlite3 = require('..');
var helper = require('./support/helper');

describe('attach', function() {
  // Check that ATTACH is not supported, as part of defense in depth measures.
  it ('does not permit attaching another db', function(done) {
    helper.deleteFile('test/tmp/test_attach.db');
    var db = new sqlite3.Database('test/tmp/test_attach.db', function(err) {
      if (err) throw err;
      db.exec("ATTACH 'test/support/prepare.db' AS zing", function (err) {
        if (!err) {
          throw new Error('ATTACH should not succeed');
        }
        if (err.errno === sqlite3.ERROR &&
            err.message === 'SQLITE_ERROR: too many attached databases - max 0') {
          db.close(done);
        } else {
          throw err;
        }
      });
    });
  });
});
