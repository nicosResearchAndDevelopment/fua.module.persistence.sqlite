--SELECT termId, termType, value, language, datatype
SELECT termType, value, language, datatype
FROM term_table
--WHERE termId = $termId
WHERE termId = ?
