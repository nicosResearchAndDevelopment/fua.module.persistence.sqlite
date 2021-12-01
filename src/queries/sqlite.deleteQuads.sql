DELETE
FROM quad_table
WHERE ($subjectId IS NULL OR $subjectId = subjectId)
AND ($predicateId IS NULL OR $predicateId = predicateId)
AND ($objectId IS NULL OR $objectId = objectId)
AND ($graphId IS NULL OR $graphId = graphId)
