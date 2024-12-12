const
    util               = require('@fua/core.util'),
    assert             = new util.Assert('module.persistence.sqlite'),
    // SEE https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md
    // SQLiteDatabase = require('better-sqlite3'),
    openWorkerDatabase = require('./better-sqlite3-worker.js'),
    {DataStore}        = require('@fua/module.persistence'),
    {join: joinPath}   = require('path'),
    {readFileSync}     = require('fs'),
    loadQuery          = (filename) => readFileSync(joinPath(__dirname, 'queries', filename)).toString(),
    sqlQueries         = Object.freeze({
        setupTables: loadQuery('sqlite.setupTables.sql'),
        addTerm:     loadQuery('sqlite.addTerm.sql'),
        addQuad:     loadQuery('sqlite.addQuad.sql'),
        getTerm:     loadQuery('sqlite.getTerm.sql')
    });

class SQLiteStore extends DataStore {

    #db    = null;
    #stmts = null;

    constructor(options, factory) {
        super(options, factory);
        const {dbFile} = options;
        assert(util.isString(dbFile), 'SQLiteStore#constructor : invalid dbFile');
        this.#db = (async () => {
            const db = await openWorkerDatabase(dbFile, {
                readonly:      false,
                fileMustExist: false
            });
            await db.exec(sqlQueries.setupTables);
            this.#stmts = Object.freeze({
                addTerm: await db.prepare(sqlQueries.addTerm),
                addQuad: await db.prepare(sqlQueries.addQuad)
            });
            this.#db    = db;
            return db;
        })();
    } // SQLiteStore#constructor

    // TODO: size(): Promise<number>

    // TODO: match(subject, predicate, object, graph): Promise<Dataset>

    async add(quads) {
        const
            quadArr = await super.add(quads);

        try {
            let quadsAdded = 0;
            await this.#db;

            const termArr = [], quadMatrix = [];
            for (let {subject, predicate, object, graph} of quadArr) {
                const quadEntry = [];
                for (let term of [subject, predicate, object, graph]) {
                    let termIndex = termArr.findIndex(compare => compare.equals(term));
                    if (termIndex < 0) {
                        termIndex = termArr.length;
                        termArr.push(term);
                    }
                    quadEntry.push(termIndex);
                }
                quadMatrix.push(quadEntry);
            }

            const termMap = new Map(await Promise.all(termArr.map(async (term, termIndex) => {
                const {termId} = await this.#stmts.addTerm.get(
                    term.termType, term.value ?? '', term.language ?? '', term.datatype?.value ?? ''
                );
                return [termIndex, termId];
            })));

            await Promise.all(quadMatrix.map(async (quadEntry) => {
                const {changes} = await this.#stmts.addQuad.run(
                    ...quadEntry.map(termIndex => termMap.get(termIndex))
                );
                if (changes) quadsAdded++;
            }));

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

    async close() {
        const db = await this.#db;
        await db.close();
    } // SQLiteStore#close

} // SQLiteStore

module.exports = SQLiteStore;
