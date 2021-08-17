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

    // TODO: constructor(options, factory): SQLiteStore
    // TODO: size(): Promise<number>
    // TODO: match(subject, predicate, object, graph): Promise<Dataset>
    // TODO: add(quads): Promise<number>
    // TODO: addStream(stream): Promise<number>
    // TODO: delete(quads): Promise<number>
    // TODO: deleteStream(stream): Promise<number>
    // TODO: deleteMatches(subject, predicate, object, graph): Promise<number>
    // TODO: has(quads): Promise<boolean>

}

module.exports = SQLiteStore;
