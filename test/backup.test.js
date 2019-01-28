var sqlite3 = require('..');
var assert = require('assert');
var fs = require('fs');
var helper = require('./support/helper');

sqlite3.verbose();

describe('backup', function() {
    before(function() {
        helper.ensureExists('test/tmp');
    });

    var db;
    beforeEach(function(done) {
        helper.deleteFile('test/tmp/backup.db');
        db = new sqlite3.Database('test/support/prepare.db', sqlite3.OPEN_READONLY, done);
    });

    afterEach(function(done) {
        helper.deleteFile('test/tmp/backup.db');
        if (!db) { done(); }
        db.close(done);
    });

    it ('output db not created if finished immediately', function(done) {
        var backup = db.backup('test/tmp/backup.db', 'main');
        backup.finish(function(err) {
            if (err) throw err;
            assert.fileDoesNotExist('test/tmp/backup.db');
            done();
        });
    });

    it ('error closing db if backup not finished', function(done) {
        var backup = db.backup('test/tmp/backup.db', 'main');
        db.close(function(err) {
            db = null;
            if (!err) throw new Error('should have an error');
            if (err.errno == sqlite3.BUSY &&
                err.message === 'SQLITE_BUSY: unable to close due to unfinalized statements or unfinished backups') {
                done();
            }
            else throw err;
        });
    });

    it ('output db created once step is called', function(done) {
        var backup = db.backup('test/tmp/backup.db', 'main');
        backup.step(1, function(err) {
            if (err) throw err;
            assert.fileExists('test/tmp/backup.db');
            backup.finish(done);
        });
    });

    it ('copies source fully with step(-1)', function(done) {
        var backup = db.backup('test/tmp/backup.db', 'main');
        backup.step(-1, function(err) {
            if (err) throw err;
            assert.fileExists('test/tmp/backup.db');
            backup.finish(function(err) {
                if (err) throw err;
                var db2 = new sqlite3.Database('test/tmp/backup.db', sqlite3.OPEN_READONLY, function(err) {
                    if (err) throw err;
                    db.get("SELECT COUNT(*) as count FROM foo", function(err, row) {
                        if (err) throw err;
                        db2.get("SELECT COUNT(*) as count FROM foo", function(err, row2) {
                            if (err) throw err;
                            assert.equal(row.count, row2.count);
                            db2.close(done);
                        });
                    });
                });
            });
        });
    });
});
