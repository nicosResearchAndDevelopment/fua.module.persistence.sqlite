const
    path         = require('path'),
    openDatabase = require('../src/better-sqlite3-worker.js');

(async () => {
    try {
        const
            filename = path.join(__dirname, 'test-database.db'),
            options  = {
                readonly:      false,
                fileMustExist: false
            },
            db       = await openDatabase(filename, options);

        console.log(db);
        debugger;
    } catch (err) {
        console.error(err?.stack ?? err);
        debugger;
    }
})().then(process.exit).catch(console.error);
