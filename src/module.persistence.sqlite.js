const
    util               = require('@nrd/fua.core.util'),
    assert             = new util.Assert('module.persistence.sqlite'),
    // SEE https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md
    // SQLiteDatabase = require('better-sqlite3'),
    openWorkerDatabase = require('./better-sqlite3-worker.js'),
    {DataStore}        = require('@nrd/fua.module.persistence'),
    {join: joinPath}   = require('path'),
    {readFileSync}     = require('fs'),
    loadQuery          = (filename) => readFileSync(joinPath(__dirname, 'queries', filename)).toString(),
    sqlQueries         = Object.freeze({
        setupTables:  loadQuery('sqlite.setupTables.sql'),
        setupIndices: loadQuery('sqlite.setupIndices.sql'),
        addTerm:      loadQuery('sqlite.addTerm.sql')
    });

class SQLiteStore extends DataStore {

    #db    = null;
    #stmts = null;

    constructor(options, factory) {
        super(options, factory);
        const {dbFile} = options;
        assert(util.isString(dbFile), 'SQLiteStore#constructor : invalid dbFile');
        this.#db = (async () => {
            this.#db    = await openWorkerDatabase(dbFile);
            this.#stmts = Object.freeze({
                addTerm: await this.#db.prepare(sqlQueries.addTerm)
            });
            return this.#db;
        })();
    } // SQLiteStore#constructor

    // TODO: size(): Promise<number>

    // TODO: match(subject, predicate, object, graph): Promise<Dataset>

    async add(quads) {
        const
            quadArr = await super.add(quads);

        try {
            let quadsAdded = 0;

            const
                db = await this.#db;

            // TODO: add(quads): Promise<number>

            return quadsAdded;
        } catch (err) {
            this.emit('error', err);
            throw err;
        }
    } // SQLiteStore#add

    // TODO: addStream(stream): Promise<number>

    // TODO: delete(quads): Promise<number>

    // TODO: deleteStream(stream): Promise<number>

    // TODO: deleteMatches(subject, predicate, object, graph): Promise<number>

    // TODO: has(quads): Promise<boolean>

}

module.exports = SQLiteStore;
