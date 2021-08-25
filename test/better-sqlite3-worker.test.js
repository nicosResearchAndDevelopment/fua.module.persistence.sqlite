const
    path         = require('path'),
    fs           = require('fs'),
    openDatabase = require('../src/better-sqlite3-worker.js'),
    loadQuery    = (filename) => fs.readFileSync(path.join(__dirname, '../src/queries', filename)).toString(),
    sqlQueries   = Object.freeze({
        setupTables: loadQuery('sqlite.setupTables.sql'),
        addTerm:     loadQuery('sqlite.addTerm.sql'),
        getTerm:     loadQuery('sqlite.getTerm.sql'),
        addQuad:     loadQuery('sqlite.addQuad.sql')
    });

(async () => {
    try {
        const database = await openDatabase(
            path.join(__dirname, 'test-database.db'),
            {
                readonly:      false,
                fileMustExist: false
            }
        );

        await database.exec(sqlQueries.setupTables);

        const addTermStmt = await database.prepare(sqlQueries.addTerm);
        const getTermStmt = await database.prepare(sqlQueries.getTerm);

        await addTermStmt.run({termType: 'DefaultGraph', value: '', language: '', datatype: ''});
        await addTermStmt.run({termType: 'NamedNode', value: 'ex:hello', language: '', datatype: ''});
        await addTermStmt.run({
            termType: 'Literal',
            value:    'Hello World',
            language: 'en',
            datatype: 'rdf:langString'
        });

        console.log(await getTermStmt.get({termId: 3}));

        debugger;
    } catch (err) {
        console.error(err?.stack ?? err);
        debugger;
    }
})().then(process.exit).catch(console.error);
