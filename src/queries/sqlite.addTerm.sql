INSERT
--INSERT OR IGNORE
INTO term_table ( termType, value, language, datatype )
VALUES ( $termType, $value, $language, $datatype )
--VALUES ( ?, ?, ?, ? )
ON CONFLICT DO
    UPDATE SET termType = excluded.termType -- TODO: this might be a problem with foreign-key-constraint in quad_table (maybe not)

RETURNING termId
--    , termId = last_insert_rowid() AS created -- NOTE: works because of autoincrement: https://www.sqlite.org/autoinc.html
