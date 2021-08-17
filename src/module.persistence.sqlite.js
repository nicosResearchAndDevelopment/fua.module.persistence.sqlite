const
    util           = require('@nrd/fua.core.util'),
    assert         = new util.Assert('module.persistence.sqlite'),
    // SEE https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md
    SQLiteDatabase = require('better-sqlite3'),
    {DataStore}    = require('@nrd/fua.module.persistence');

class SQLiteStore extends DataStore {

    // TODO implement interface

}

module.exports = SQLiteStore;
