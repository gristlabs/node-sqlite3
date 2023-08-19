const sqlite3 = require('..');
const assert = require('assert');

const testCases = [
  { sql: 'DELETE FROM foo', readOnly: false },
  { sql: 'SELECT * FROM foo', readOnly: true },
  { sql: 'UPDATE foo SET x = 10', readOnly: false },
  { sql: 'PRAGMA application_id', readOnly: true },
  { sql: 'PRAGMA application_id = 1', readOnly: false },
  { sql: 'CREATE TABLE bar(x, y)', readOnly: false },
  { sql: 'CREATE TABLE IF NOT EXISTS foo(x, y)', readOnly: false },

  // Prepare only uses the first statement if there are multiple
  // (the rest are returned in a tail string by the underlying
  // sqlite3 function). The readOnly flag is for that first
  // statement. Anything after the first statement could be
  // readOnly or not readOnly, it just won't be running.
  { sql: 'SELECT * FROM foo; DELETE FROM foo', readOnly: true },

  // Statements that only affect the connection don't count.
  // This is too bad, wish there were a way to detect such things.
  { sql: 'PRAGMA query_only = false', readOnly: true },
  { sql: 'ATTACH DATABASE \'test\' AS test', readOnly: true },
];

describe('readOnly', function() {
    let db;

    before(function(done) {
        db = new sqlite3.Database(':memory:', function(err) {
            if (err) throw err;
            db.run('CREATE TABLE foo(x, y)', function(err) {
                if (err) throw err;
                done();
            });
        });
    });

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        it("reports " + testCase.sql + " as " +
           (testCase.readOnly ? "not " : "") + "readOnly", function(done) {
            const stmt = db.prepare(testCase.sql, function(err) {
                if (err) throw err;
                assert.equal(stmt.readOnly, testCase.readOnly);
                stmt.finalize(done);
            });
        });
    }
});
