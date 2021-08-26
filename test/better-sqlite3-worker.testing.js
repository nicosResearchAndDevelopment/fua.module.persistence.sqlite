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
        // const getTermStmt = await database.prepare(sqlQueries.getTerm);

        // console.log(await addTermStmt.get({
        //     termType: 'DefaultGraph',
        //     value:    '',
        //     language: '',
        //     datatype: ''
        // }));
        // console.log(await addTermStmt.get({
        //     termType: 'NamedNode',
        //     value:    'ex:hello',
        //     language: '',
        //     datatype: ''
        // }));
        console.log(await addTermStmt.run({
            termType: 'Literal',
            value:    'Hello World',
            language: 'en',
            datatype: 'rdf:langString'
        }));
        // console.log(await addTermStmt.get('Literal', 'Hello World', 'en', 'rdf:langString'));

        console.log(await getTermStmt.get(1));

        // const
        //     {termId, created} = await addTermStmt.get('NamedNode', 'ex:hello', '', ''),
        //     data              = await getTermStmt.get(termId);

        // console.log({termId, created, data});

        debugger;
    } catch (err) {
        console.error(err?.stack ?? err);
        debugger;
    }
})().then(process.exit).catch(console.error);
