const
    util                 = require('@nrd/fua.core.util'),
    assert               = new util.Assert('module.persistence.sqlite'),
    BetterSQLiteDatabase = require('better-sqlite3'),
    {DataStore}          = require('@nrd/fua.module.persistence'),
    queries              = require('./queries/index.js');

class SQLiteStore extends DataStore {

    #db = null;

    constructor(options, factory) {
        super(options, factory);
        const {dbFile} = options;
        this.#db       = new BetterSQLiteDatabase(dbFile, {
            readonly:      false,
            fileMustExist: false
        });
    } // SQLiteStore#constructor

    async size() {
        assert(false, 'not implemented');
        // TODO
    } // SQLiteStore#size

    async match(subject, predicate, object, graph) {
        assert(false, 'not implemented');
        const dataset = await super.match(subject, predicate, object, graph);
        // TODO
    } // SQLiteStore#match

    async add(quads) {
        assert(false, 'not implemented');
        const quadArr = await super.add(quads);
        // TODO
    } // SQLiteStore#add

    async addStream(stream) {
        assert(false, 'not implemented');
        const quadStream = await super.addStream(stream);
        // TODO
    } // SQLiteStore#addStream

    async delete(quads) {
        assert(false, 'not implemented');
        const quadArr = await super.delete(quads);
        // TODO
    } // SQLiteStore#delete

    async deleteStream(stream) {
        assert(false, 'not implemented');
        const quadStream = await super.deleteStream(stream);
        // TODO
    } // SQLiteStore#deleteStream

    async deleteMatches(subject, predicate, object, graph) {
        assert(false, 'not implemented');
        await super.deleteMatches(subject, predicate, object, graph);
        // TODO
    } // SQLiteStore#deleteMatches

    async has(quads) {
        assert(false, 'not implemented');
        const quadArr = await super.has(quads);
        // TODO
    } // SQLiteStore#has

    async setupTables() {
        assert(false, 'not implemented');
        // TODO
    } // SQLiteStore#setupTables

} // SQLiteStore

module.exports = SQLiteStore;
