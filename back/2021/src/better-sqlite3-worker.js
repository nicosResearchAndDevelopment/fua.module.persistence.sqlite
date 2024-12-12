const
    worker_threads       = require('worker_threads'),
    BetterSQLiteDatabase = require('better-sqlite3'),
    util                 = require('@fua/core.util'),
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
}
// if (!worker_threads.isMainThread) {
else {
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

    async transaction(txFunction) {
        util.assert(false, 'RemoteDatabase#transaction : not supported in async');
    } // RemoteDatabase#transaction

    async pragma(sqlPragma, queryOptions) {
        return await this.#transfer('pragma', sqlPragma, queryOptions);
    } // RemoteDatabase#pragma

    async backup(destination, backupOptions) {
        return await this.#transfer('backup', destination, backupOptions);
    } // RemoteDatabase#backup

    async serialize(serializeOptions) {
        return await this.#transfer('serialize', serializeOptions);
    } // RemoteDatabase#serialize

    async function(fnName, fnOptions, customFn) {
        util.assert(false, 'RemoteDatabase#function : not supported in async');
    } // RemoteDatabase#function

    async aggregate(fnName, fnOptions) {
        util.assert(false, 'RemoteDatabase#aggregate : not supported in async');
    } // RemoteDatabase#aggregate

    async table(tableName, tableDef) {
        util.assert(false, 'RemoteDatabase#table : not supported in async');
    } // RemoteDatabase#table

    async loadExtension(extPath, entryPoint) {
        await this.#transfer('loadExtension', extPath, entryPoint);
    } // RemoteDatabase#loadExtension

    async exec(sqlQuery) {
        await this.#transfer('exec', sqlQuery);
    } // RemoteDatabase#exec

    async close() {
        await this.#transfer('close');
        this.#port.close();
    } // RemoteDatabase#close

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

    async get(...params) {
        return await this.#transfer('get', ...params);
    } // RemoteStatement#get

    async all(...params) {
        return await this.#transfer('all', ...params);
    } // RemoteStatement#all

    async iterate(...params) {
        util.assert(false, 'RemoteStatement#iterate : not supported in async');
    } // RemoteStatement#iterate

    async pluck(toggleState) {
        await this.#transfer('pluck', toggleState);
    } // RemoteStatement#pluck

    async expand(toggleState) {
        await this.#transfer('expand', toggleState);
    } // RemoteStatement#expand

    async raw(toggleState) {
        await this.#transfer('raw', toggleState);
    } // RemoteStatement#raw

    async columns() {
        return await this.#transfer('columns');
    } // RemoteStatement#columns

    async bind(...params) {
        await this.#transfer('bind', ...params);
    } // RemoteStatement#bind

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

async function WorkerMessageHandler({port, method, args}) {
    try {
        const result = await this[method](...args);
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

    transaction(...args) {
        util.assert(false, 'WorkerDatabase#transaction : not supported as worker');
    } // WorkerDatabase#transaction

    pragma(...args) {
        this.#db.pragma(...args);
    } // WorkerDatabase#pragma

    backup(...args) {
        this.#db.backup(...args);
    } // WorkerDatabase#backup

    serialize(...args) {
        this.#db.serialize(...args);
    } // WorkerDatabase#serialize

    function(...args) {
        util.assert(false, 'WorkerDatabase#function : not supported as worker');
    } // WorkerDatabase#function

    aggregate(...args) {
        util.assert(false, 'WorkerDatabase#aggregate : not supported as worker');
    } // WorkerDatabase#aggregate

    table(...args) {
        util.assert(false, 'WorkerDatabase#table : not supported as worker');
    } // WorkerDatabase#table

    loadExtension(...args) {
        this.#db.loadExtension(...args);
    } // WorkerDatabase#loadExtension

    exec(...args) {
        this.#db.exec(...args);
    } // WorkerDatabase#exec

    close() {
        this.#db.close();
    } // WorkerDatabase#close

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

    get(...params) {
        return this.#stmt.get(...params);
    } // WorkerStatement#get

    all(...params) {
        return this.#stmt.all(...params);
    } // WorkerStatement#all

    iterate(...params) {
        util.assert(false, 'WorkerStatement#iterate : not supported as worker');
    } // WorkerStatement#iterate

    pluck(toggleState) {
        this.#stmt.pluck(toggleState);
    } // WorkerStatement#pluck

    expand(toggleState) {
        this.#stmt.expand(toggleState);
    } // WorkerStatement#expand

    raw(toggleState) {
        this.#stmt.raw(toggleState);
    } // WorkerStatement#raw

    columns() {
        return this.#stmt.columns();
    } // WorkerStatement#columns

    bind(...params) {
        this.#stmt.bind(...params);
    } // WorkerStatement#bind

} // WorkerStatement
