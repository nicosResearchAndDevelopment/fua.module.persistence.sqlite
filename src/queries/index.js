const
    {join: joinPath} = require('path'),
    {readFileSync}   = require('fs'),
    loadQuery        = (filename) => readFileSync(joinPath(__dirname, filename), 'utf-8');

exports.setupTables = loadQuery('sqlite.setupTables.sql');
exports.countQuads  = loadQuery('sqlite.countQuads.sql');

exports.addTerm = loadQuery('sqlite.addTerm.sql');
exports.addQuad = loadQuery('sqlite.addQuad.sql');

exports.getTerm   = loadQuery('sqlite.getTerm.sql');
exports.getTermId = loadQuery('sqlite.getTermId.sql');
exports.getQuads  = loadQuery('sqlite.getQuads.sql');

exports.deleteQuads = loadQuery('sqlite.deleteQuads.sql');

Object.freeze(exports);
