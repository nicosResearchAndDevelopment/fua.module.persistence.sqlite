CREATE TABLE IF NOT EXISTS term_table (
    termId INTEGER PRIMARY KEY AUTOINCREMENT,
    termType TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT "",
    language TEXT NOT NULL DEFAULT "",
    datatype TEXT NOT NULL DEFAULT ""
);

--CREATE TABLE IF NOT EXISTS quad_table (
--    quadId INTEGER PRIMARY KEY AUTOINCREMENT,
--    subjectId INTEGER NOT NULL,
--    predicateId INTEGER NOT NULL,
--    objectId INTEGER NOT NULL,
--    graphId INTEGER NOT NULL
--);

CREATE TABLE IF NOT EXISTS quad_table (
    subjectId INTEGER NOT NULL,
    predicateId INTEGER NOT NULL,
    objectId INTEGER NOT NULL,
    graphId INTEGER NOT NULL,
    PRIMARY KEY (subjectId, predicateId, objectId, graphId),
    FOREIGN KEY (subjectId)
          REFERENCES term_table (termId)
             ON DELETE RESTRICT
             ON UPDATE RESTRICT,
    FOREIGN KEY (predicateId)
          REFERENCES term_table (termId)
             ON DELETE RESTRICT
             ON UPDATE RESTRICT,
    FOREIGN KEY (objectId)
          REFERENCES term_table (termId)
             ON DELETE RESTRICT
             ON UPDATE RESTRICT,
    FOREIGN KEY (graphId)
          REFERENCES term_table (termId)
             ON DELETE RESTRICT
             ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS term_index ON term_table (
    termType,
    value,
    language,
    datatype
);

CREATE UNIQUE INDEX IF NOT EXISTS quad_index ON quad_table (
    subjectId,
    predicateId,
    objectId,
    graphId
);
