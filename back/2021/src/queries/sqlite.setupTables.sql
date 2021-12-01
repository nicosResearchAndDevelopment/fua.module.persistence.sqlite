CREATE TABLE
IF NOT EXISTS
term_table (
    termId INTEGER
        PRIMARY KEY AUTOINCREMENT,

    termType TEXT
        NOT NULL,

    value TEXT
        NOT NULL
        DEFAULT '',

    language TEXT
        NOT NULL
        DEFAULT '',

    datatype TEXT
        NOT NULL
        DEFAULT '',

    UNIQUE (
        termType,
        value,
        language,
        datatype
    )
);

CREATE TABLE
IF NOT EXISTS
quad_table (
--    quadId INTEGER
--        PRIMARY KEY AUTOINCREMENT,

    subjectId INTEGER
        NOT NULL
        REFERENCES term_table (termId)
             ON DELETE RESTRICT
             ON UPDATE RESTRICT,

    predicateId INTEGER
        NOT NULL
        REFERENCES term_table (termId)
             ON DELETE RESTRICT
             ON UPDATE RESTRICT,

    objectId INTEGER
        NOT NULL
        REFERENCES term_table (termId)
             ON DELETE RESTRICT
             ON UPDATE RESTRICT,

    graphId INTEGER
        NOT NULL
        REFERENCES term_table (termId)
             ON DELETE RESTRICT
             ON UPDATE RESTRICT,

    PRIMARY KEY (
        subjectId,
        predicateId,
        objectId,
        graphId
    )

--    UNIQUE (
--        subjectId,
--        predicateId,
--        objectId,
--        graphId
--    )
);
