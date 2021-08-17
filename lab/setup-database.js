const
    path           = require('path'),
    fs             = require('fs'),
    // SEE https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md
    SQLiteDatabase = require('better-sqlite3'),
    testData       = new SQLiteDatabase(path.join(__dirname, 'test-data.db'));

// const initialQueries = fs.readFileSync(path.join(__dirname, 'initial-queries.sql'), 'utf8');
// testData.exec(initialQueries);

testData.prepare(`
    INSERT INTO term_table (termType, value)
    VALUES ($termType, $value)
`).run({termType: 'NamedNode', value: 'ex:test'});
