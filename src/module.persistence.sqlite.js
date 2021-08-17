const
    util           = require('@nrd/fua.core.util'),
    assert         = new util.Assert('module.persistence.sqlite'),
    // SEE https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md
    SQLiteDatabase = require('better-sqlite3'),
    {DataStore}    = require('@nrd/fua.module.persistence');

class SQLiteStore extends DataStore {

    /**
     * @type {SQLiteDatabase}
     * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#class-database
     */
    #db = null;

    constructor(options, factory) {
        super(options, factory);
        const {dbFile} = options;
        assert(util.isString(dbFile), 'SQLiteStore#constructor : invalid dbFile');
        this.#db = new SQLiteDatabase(dbFile);
    } // SQLiteStore#constructor

    // TODO: size(): Promise<number>

    // TODO: match(subject, predicate, object, graph): Promise<Dataset>

    async add(quads) {
        const
            quadArr = await super.add(quads);

        try {
            let quadsAdded = 0;

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
