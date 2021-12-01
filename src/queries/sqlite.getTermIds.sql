SELECT termId
FROM term_table
WHERE ($termType IS NULL OR $termType = termType)
AND ($value IS NULL OR $value = value)
AND ($language IS NULL OR $language = language)
AND ($datatype IS NULL OR $datatype = datatype)
