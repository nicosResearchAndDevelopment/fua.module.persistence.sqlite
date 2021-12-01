SELECT termId
FROM term_table
WHERE ($termType = termType)
AND ($value = value)
AND ($language IS NULL OR $language = language)
AND ($datatype IS NULL OR $datatype = datatype)
