// -*- mode:C++; tab-width:4; c-basic-offset:4; indent-tabs-mode:nil -*-

#ifndef NODE_SQLITE3_SRC_BACKUP_H
#define NODE_SQLITE3_SRC_BACKUP_H

#include "database.h"
#include "threading.h"

#include <cstdlib>
#include <cstring>
#include <string>
#include <queue>
#include <vector>

#include <sqlite3.h>
#include <nan.h>

using namespace v8;
using namespace node;

namespace node_sqlite3 {

class Backup : public Nan::ObjectWrap {
public:
    static Nan::Persistent<FunctionTemplate> constructor_template;

    static NAN_MODULE_INIT(Init);
    static NAN_METHOD(New);

    struct Baton {
        uv_work_t request;
        Backup* backup;
        Nan::Persistent<Function> callback;

        Baton(Backup* backup_, Local<Function> cb_) : backup(backup_) {
            backup->Ref();
            request.data = this;
            callback.Reset(cb_);
        }
        virtual ~Baton() {
            backup->Unref();
            callback.Reset();
        }
    };

    struct InitializeBaton : Database::Baton {
        Backup* backup;
        std::string filename;
        std::string dbname;
        InitializeBaton(Database* db_, Local<Function> cb_, Backup* backup_) :
            Baton(db_, cb_), backup(backup_) {
            backup->Ref();
        }
        virtual ~InitializeBaton() {
            backup->Unref();
            if (!db->IsOpen() && db->IsLocked()) {
                // The database handle was closed before the backup could be opened.
                backup->Finisher();
            }
        }
    };

    struct StepBaton : Baton {
        int pages;
        StepBaton(Backup* backup_, Local<Function> cb_, int pages_) :
            Baton(backup_, cb_), pages(pages_) {}
    };

    typedef void (*Work_Callback)(Baton* baton);

    struct Call {
        Call(Work_Callback cb_, Baton* baton_) : callback(cb_), baton(baton_) {};
        Work_Callback callback;
        Baton* baton;
    };

    Backup(Database* db_) : Nan::ObjectWrap(),
           db(db_),
           _handle(NULL),
           db2(NULL),
           inited(false),
           locked(false),
           finished(false) {
        db->Ref();
    }

    ~Backup() {
        if (_handle) {
            sqlite3_backup_finish(_handle);
            _handle = NULL;
        }
        if (db2) {
            sqlite3_close(db2);
            db2 = NULL;
        }
        finished = true;
    }

    WORK_DEFINITION(Step);
    WORK_DEFINITION(Finish);

protected:
    static void Work_BeginInitialize(Database::Baton* baton);
    static void Work_Initialize(uv_work_t* req);
    static void Work_AfterInitialize(uv_work_t* req);

    void Schedule(Work_Callback callback, Baton* baton);
    void Process();
    void CleanQueue();
    template <class T> static void Error(T* baton);

    static void Finalize(Baton* baton);
    void Finisher();

    Database* db;

    sqlite3_backup* _handle;
    sqlite3* db2;
    int status;
    std::string message;

    bool inited;
    bool locked;
    bool finished;
    std::queue<Call*> queue;
};

}

#endif
