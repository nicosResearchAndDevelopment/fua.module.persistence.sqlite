const
    path         = require('path'),
    fs           = require('fs'),
    openDatabase = require('../src/better-sqlite3-worker.js'),
    loadQuery    = (filename) => fs.readFileSync(path.join(__dirname, '../src/queries', filename)).toString(),
    sqlQueries   = Object.freeze({
        setupTables:  loadQuery('sqlite.setupTables.sql'),
        setupIndices: loadQuery('sqlite.setupIndices.sql'),
        addTerm:      loadQuery('sqlite.addTerm.sql'),
        addQuad:      loadQuery('sqlite.addQuad.sql')
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

        // await database.exec(sqlQueries.setupTables);
        // await database.exec(sqlQueries.setupIndices);

        const addTermStmt = await database.prepare(sqlQueries.addTerm);

        console.log(await addTermStmt.run({termType: 'DefaultGraph', value: '', language: '', datatype: ''}));
        console.log(await addTermStmt.run({termType: 'NamedNode', value: 'ex:hello', language: '', datatype: ''}));
        console.log(await addTermStmt.run({
            termType: 'Literal',
            value:    'Hello World',
            language: 'en',
            datatype: 'rdf:langString'
        }));

        debugger;
    } catch (err) {
        console.error(err?.stack ?? err);
        debugger;
    }
})().then(process.exit).catch(console.error);
