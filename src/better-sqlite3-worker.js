const
    worker_threads       = require('worker_threads'),
    BetterSQLiteDatabase = require('better-sqlite3');

if (worker_threads.isMainThread) {
    //region >> MAIN_THREAD

    const
        {Worker, MessageChannel} = worker_threads,
        mainWorker               = new Worker(__filename);

    class WorkerStatement {

        #port = null;

        constructor(port) {
            this.#port = port;
        }

        #transfer(method, ...args) {
            return new Promise((resolve, reject) => {
                const channel = new MessageChannel();
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
        }

        // TODO

    } // WorkerStatement

    class WorkerDatabase {

        #port = null;

        constructor(port) {
            this.#port = port;
        }

        #transfer(method, ...args) {
            return new Promise((resolve, reject) => {
                const channel = new MessageChannel();
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
        }

        async prepare(sqlQuery) {
            const
                channel     = new MessageChannel(),
                stmtChannel = new MessageChannel();

            await new Promise((resolve, reject) => {
                channel.port1.once('message', ({error}) => {
                    channel.port1.close();
                    if (error) {
                        stmtChannel.port1.close();
                        reject(error);
                    } else resolve();
                });
                this.#port.postMessage({
                    port:   channel.port2,
                    method: 'prepare',
                    args:   [stmtChannel.port2, sqlQuery]
                }, [channel.port2, stmtChannel.port2]);
            });

            return new WorkerStatement(stmtChannel.port1);
        }

        async exec(sqlQuery) {
            await this.#transfer('exec', sqlQuery);
            return this;
        }

        async close() {
            await this.#transfer('close');
            return this;
        }

    } // WorkerDatabase

    module.exports = async function (filename, options) {
        const mainChannel = new MessageChannel();

        await new Promise((resolve, reject) => {
            mainChannel.port1.once('message', ({error}) => {
                if (error) {
                    mainChannel.port1.close();
                    reject(error);
                } else resolve();
            });
            mainWorker.postMessage({
                mainPort: mainChannel.port2,
                filename, options
            }, [mainChannel.port2]);
        });

        return new WorkerDatabase(mainChannel.port1);
    } // module.exports

    //endregion >> MAIN_THREAD
} else {
    //region >> WORKER_THREAD

    const
        {parentPort} = worker_threads;

    function ReturnMessage(error, result) {
        if (!new.target) return new ReturnMessage(error, result);
        if (error) {
            this.error = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
        } else {
            this.error  = null;
            this.result = result;
        }
    } // ReturnMessage

    function constructionHandler(mainPort, filename, options) {
        const
            betterDB      = new BetterSQLiteDatabase(filename, options),
            methodHandler = Object.create(null);

        methodHandler['prepare'] = function (stmtPort, sqlQuery) {
            const
                statement   = betterDB.prepare(sqlQuery),
                stmtHandler = Object.create(null);

            // TODO
        };

        methodHandler['run'] = function (sqlQuery, ...parameter) {
            return betterDB.prepare(sqlQuery).run(...parameter);
        };

        methodHandler['exec'] = function (sqlQuery) {
            betterDB.exec(sqlQuery);
        };

        methodHandler['close'] = function () {
            betterDB.close();
        };

        mainPort.on('message', ({port, method, args}) => {
            try {
                const res = methodHandler[method](...args);
                port.postMessage(new ReturnMessage(null, res));
            } catch (err) {
                port.postMessage(new ReturnMessage(err));
            }
        });
    } // constructionHandler

    parentPort.on('message', ({mainPort, filename, options}) => {
        try {
            constructionHandler(mainPort, filename, options);
            mainPort.postMessage(new ReturnMessage(null));
        } catch (err) {
            mainPort.postMessage(new ReturnMessage(err));
        }
    });

    //endregion >> WORKER_THREAD
}
