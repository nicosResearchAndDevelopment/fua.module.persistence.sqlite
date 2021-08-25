const
    path              = require('path'),
    fs                = require('fs'),
    openDatabase      = require('../src/better-sqlite3-worker.js'),
    setupTablesQuery  = fs.readFileSync(path.join(__dirname, '../src/queries/sqlite.setupTables.sql')).toString(),
    setupIndicesQuery = fs.readFileSync(path.join(__dirname, '../src/queries/sqlite.setupIndices.sql')).toString();

(async () => {
    try {
        const database = await openDatabase(
            path.join(__dirname, 'test-database.db'),
            {
                readonly:      false,
                fileMustExist: true
            }
        );

        await database.exec(setupTablesQuery);
        await database.exec(setupIndicesQuery);

        const statement = await database.prepare(`
            INSERT INTO term_table (termType) VALUES ('DefaultGraph')
        `);

        const result = await statement.run();
        console.log(result);

        debugger;
    } catch (err) {
        console.error(err?.stack ?? err);
        debugger;
    }
})().then(process.exit).catch(console.error);
