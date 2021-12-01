DELETE
FROM term_table
WHERE NOT EXISTS (
    SELECT *
    FROM quad_table
    WHERE term_table.termId = quad_table.subjectId
    OR term_table.termId = quad_table.predicateId
    OR term_table.termId = quad_table.objectId
    OR term_table.termId = quad_table.graphId
)
