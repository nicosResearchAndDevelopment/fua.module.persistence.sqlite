const
    {join: joinPath} = require('path'),
    {readFileSync}   = require('fs'),
    loadQuery        = (filename) => readFileSync(joinPath(__dirname, filename), 'utf-8');

exports.setupTables = loadQuery('sqlite.setupTables.sql');
exports.addQuad     = loadQuery('sqlite.addQuad.sql');
exports.addTerm     = loadQuery('sqlite.addTerm.sql');
exports.getTerm     = loadQuery('sqlite.getTerm.sql');
