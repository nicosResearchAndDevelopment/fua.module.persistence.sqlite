CREATE UNIQUE INDEX term_index ON term_table (
    termType,
    value,
    language,
    datatype
);

CREATE UNIQUE INDEX quad_index ON quad_table (
    subjectId,
    predicateId,
    objectId,
    graphId
);
