CREATE TABLE term_table (
    termId INTEGER PRIMARY KEY AUTOINCREMENT,
    termType TEXT NOT NULL,
    value TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT "",
    datatype TEXT NOT NULL DEFAULT ""
);

CREATE UNIQUE INDEX term_index ON term_table (
    termType, value, language, datatype
);

CREATE TABLE quad_table (
    quadId INTEGER PRIMARY KEY AUTOINCREMENT,
    subjectId INTEGER NOT NULL,
    predicateId INTEGER NOT NULL,
    objectId INTEGER NOT NULL,
    graphId INTEGER NOT NULL
);

CREATE UNIQUE INDEX quad_index ON quad_table (
    subjectId, predicateId, objectId, graphId
);
