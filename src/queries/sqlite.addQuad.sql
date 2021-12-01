--INSERT
INSERT OR IGNORE
INTO quad_table ( subjectId, predicateId, objectId, graphId )
VALUES ( $subjectId, $predicateId, $objectId, $graphId )
--VALUES ( ?, ?, ?, ? )
--ON CONFLICT DO UPDATE SET graphId = excluded.graphId
--
--RETURNING quadId
--    , quadId = last_insert_rowid() AS created
