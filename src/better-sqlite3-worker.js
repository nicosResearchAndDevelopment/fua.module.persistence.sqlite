const
    worker_threads       = require('worker_threads'),
    BetterSQLiteDatabase = require('better-sqlite3'),
    util                 = require('@nrd/fua.core.util'),
    assert               = new util.Assert('module.persistence.sqlite : better-sqlite3-worker');

if (worker_threads.isMainThread) {
    module.exports = async function (...args) {
        const
            worker  = new worker_threads.Worker(__filename),
            channel = new worker_threads.MessageChannel();

        await new Promise((resolve, reject) => {
            channel.port1.once('message', ({error}) => {
                if (error) {
                    channel.port1.close();
                    reject(error);
                } else resolve();
            });
            worker.postMessage({
                port: channel.port2,
                args
            }, [channel.port2]);
        });

        return new RemoteDatabase(channel.port1);
    };
} else {
    worker_threads.parentPort.on('message', ({port, args}) => {
        try {
            const db = new BetterSQLiteDatabase(...args);
            new WorkerDatabase(port, db);
            port.postMessage(new WorkerReturnMessage(null));
        } catch (err) {
            port.postMessage(new WorkerReturnMessage(err));
        }
    });
}

class RemoteDatabase {

    #port = null;

    async #transfer(method, ...args) {
        const channel = new worker_threads.MessageChannel();
        return await new Promise((resolve, reject) => {
            channel.port1.once('message', ({error, result}) => {
                channel.port1.close();
                if (error) reject(error);
                else resolve(result);
            });
            this.#port.postMessage({
                port: channel.port2,
                method, args
            }, [channel.port2]);
        });
    } // RemoteDatabase##transfer

    constructor(port) {
        assert(port instanceof worker_threads.MessagePort,
            'RemoteDatabase#constructor : expected port to be a MessagePort');
        this.#port = port;
    } // RemoteDatabase#constructor

    async prepare(sqlQuery) {
        const stmtPort = await this.#transfer('prepare', sqlQuery);
        return new RemoteStatement(stmtPort);
    } // RemoteDatabase#prepare

    async exec(sqlQuery) {
        await this.#transfer('exec', sqlQuery);
    } // RemoteDatabase#exec

} // RemoteDatabase

class RemoteStatement {

    #port = null;

    async #transfer(method, ...args) {
        const channel = new worker_threads.MessageChannel();
        return await new Promise((resolve, reject) => {
            channel.port1.once('message', ({error, result}) => {
                channel.port1.close();
                if (error) reject(error);
                else resolve(result);
            });
            this.#port.postMessage({
                port: channel.port2,
                method, args
            }, [channel.port2]);
        });
    } // RemoteStatement##transfer

    constructor(port) {
        assert(port instanceof worker_threads.MessagePort,
            'RemoteStatement#constructor : expected port to be a MessagePort');
        this.#port = port;
    } // RemoteStatement#constructor

    async run(...params) {
        return await this.#transfer('run', ...params);
    } // RemoteStatement#run

} // RemoteStatement

class WorkerReturnMessage {

    constructor(error, result) {
        if (error) {
            this.error = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
        } else {
            this.error  = null;
            this.result = result;
        }
    } // WorkerReturnMessage#constructor

} // WorkerReturnMessage

function WorkerMessageHandler({port, method, args}) {
    try {
        const result = this[method](...args);
        if (result instanceof worker_threads.MessagePort) {
            port.postMessage(new WorkerReturnMessage(null, result), [result]);
        } else {
            port.postMessage(new WorkerReturnMessage(null, result));
        }
    } catch (err) {
        port.postMessage(new WorkerReturnMessage(err));
    }
} // WorkerMessageHandler

class WorkerDatabase {

    #port = null;
    #db   = null;

    constructor(port, db) {
        assert(port instanceof worker_threads.MessagePort,
            'WorkerDatabase#constructor : expected port to be a MessagePort');
        assert(db instanceof BetterSQLiteDatabase,
            'WorkerDatabase#constructor : expected db to be a BetterSQLiteDatabase');
        this.#port = port;
        this.#db   = db;
        this.#port.on('message', WorkerMessageHandler.bind(this));
    } // WorkerDatabase#constructor

    prepare(sqlQuery) {
        const
            stmt    = this.#db.prepare(sqlQuery),
            channel = new worker_threads.MessageChannel();
        new WorkerStatement(channel.port1, stmt);
        return channel.port2;
    } // WorkerDatabase#prepare

    exec(...args) {
        this.#db.exec(...args);
    } // WorkerDatabase#exec

} // WorkerDatabase

class WorkerStatement {

    #port = null;
    #stmt = null;

    constructor(port, stmt) {
        assert(port instanceof worker_threads.MessagePort,
            'WorkerStatement#constructor : expected port to be a MessagePort');
        assert(util.isFunction(stmt.run),
            'WorkerDatabase#constructor : expected stmt to be a BetterSQLiteStatement');
        this.#port = port;
        this.#stmt = stmt;
        this.#port.on('message', WorkerMessageHandler.bind(this));
    } // WorkerStatement#constructor

    run(...params) {
        return this.#stmt.run(...params);
    } // WorkerStatement#run

} // WorkerStatement
