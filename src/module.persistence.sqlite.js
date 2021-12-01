const
    util                 = require('@nrd/fua.core.util'),
    assert               = new util.Assert('module.persistence.sqlite'),
    BetterSQLiteDatabase = require('better-sqlite3'),
    {DataStore}          = require('@nrd/fua.module.persistence'),
    queries              = require('./queries/index.js'),
    _termToRow           = (term) => ({
        termType: term.termType,
        value:    term.value,
        language: term.language ?? '',
        datatype: term.datatype?.value ?? ''
    }),
    _rowToTerm           = (row, factory) => factory.fromTerm({
        termType: row.termType,
        value:    row.value,
        language: row.language || undefined,
        datatype: row.datatype ? {
            termType: 'NamedNode',
            value:    row.datatype
        } : undefined
    });

class SQLiteStore extends DataStore {

    #db         = null;
    #statements = Object.create(null);

    constructor(options, factory) {
        super(options, factory);
        const {dbFile} = options;
        this.#db       = new BetterSQLiteDatabase(dbFile, {
            readonly:      false,
            fileMustExist: false
        });
    } // SQLiteStore#constructor

    async size() {
        const
            countQuads = this.#statements.countQuads
                || (this.#statements.countQuads = this.#db.prepare(queries.countQuads)),
            result     = countQuads.get();
        return result.count;
    } // SQLiteStore#size

    async match(subject, predicate, object, graph) {
        const
            dataset   = await super.match(subject, predicate, object, graph),
            getTerm   = this.#statements.getTerm
                || (this.#statements.getTerm = this.#db.prepare(queries.getTerm)),
            getTermId = this.#statements.getTermId
                || (this.#statements.getTermId = this.#db.prepare(queries.getTermId)),
            getQuads  = this.#statements.getQuads
                || (this.#statements.getQuads = this.#db.prepare(queries.getQuads)),
            quadParam = {subjectId: null, predicateId: null, objectId: null, graphId: null};
        if (subject) {
            const subjResult = getTermId.get(_termToRow(subject));
            if (!subjResult) return dataset;
            quadParam.subjectId = subjResult.termId;
        }
        if (predicate) {
            const predResult = getTermId.get(_termToRow(predicate));
            if (!predResult) return dataset;
            quadParam.predicateId = predResult.termId;
        }
        if (object) {
            const objResult = getTermId.get(_termToRow(object));
            if (!objResult) return dataset;
            quadParam.objectId = objResult.termId;
        }
        if (graph) {
            const graphResult = getTermId.get(_termToRow(graph));
            if (!graphResult) return dataset;
            quadParam.graphId = graphResult.termId;
        }
        for (let quadData of getQuads.all(quadParam)) {
            dataset.add(this.factory.quad(
                subject || _rowToTerm(getTerm.get(quadData.subjectId), this.factory),
                predicate || _rowToTerm(getTerm.get(quadData.predicateId), this.factory),
                object || _rowToTerm(getTerm.get(quadData.objectId), this.factory),
                graph || _rowToTerm(getTerm.get(quadData.graphId), this.factory)
            ));
        }
        return dataset;
    } // SQLiteStore#match

    async add(quads) {
        const
            quadArr = await super.add(quads),
            addQuad = this.#statements.addQuad
                || (this.#statements.addQuad = this.#db.prepare(queries.addQuad)),
            addTerm = this.#statements.addTerm
                || (this.#statements.addTerm = this.#db.prepare(queries.addTerm));

        let added = 0;
        for (let quad of quadArr) {
            const
                quadParam  = {
                    subjectId:   addTerm.get(_termToRow(quad.subject)).termId,
                    predicateId: addTerm.get(_termToRow(quad.predicate)).termId,
                    objectId:    addTerm.get(_termToRow(quad.object)).termId,
                    graphId:     addTerm.get(_termToRow(quad.graph)).termId
                },
                quadResult = addQuad.run(quadParam);
            if (quadResult.changes) {
                added++;
                this.emit('added', quad);
            }
        }
        return added;
    } // SQLiteStore#add

    async addStream(stream) {
        const
            quadStream = await super.addStream(stream),
            addQuad    = this.#statements.addQuad
                || (this.#statements.addQuad = this.#db.prepare(queries.addQuad)),
            addTerm    = this.#statements.addTerm
                || (this.#statements.addTerm = this.#db.prepare(queries.addTerm));

        let added = 0;
        quadStream.on('data', (quad) => {
            const
                subjResult  = addTerm.get(quad.subject.termType, quad.subject.value, quad.subject.language ?? '', quad.subject.datatype?.value ?? ''),
                predResult  = addTerm.get(quad.predicate.termType, quad.predicate.value, quad.predicate.language ?? '', quad.predicate.datatype?.value ?? ''),
                objResult   = addTerm.get(quad.object.termType, quad.object.value, quad.object.language ?? '', quad.object.datatype?.value ?? ''),
                graphResult = addTerm.get(quad.graph.termType, quad.graph.value, quad.graph.language ?? '', quad.graph.datatype?.value ?? ''),
                quadResult  = addQuad.run(subjResult.termId, predResult.termId, objResult.termId, graphResult.termId);
            if (quadResult.changes) {
                added++;
                this.emit('added', quad);
            }
        });

        await new Promise(resolve => quadStream.on('end', resolve));
        return added;
    } // SQLiteStore#addStream

    async delete(quads) {
        const
            quadArr     = await super.delete(quads),
            getTermId   = this.#statements.getTermId
                || (this.#statements.getTermId = this.#db.prepare(queries.getTermId)),
            deleteQuads = this.#statements.deleteQuads
                || (this.#statements.deleteQuads = this.#db.prepare(queries.deleteQuads));

        let deleted = 0;
        for (let quad of quadArr) {
            const quadParam  = {};
            const subjResult = getTermId.get(_termToRow(quad.subject));
            if (!subjResult) continue;
            quadParam.subjectId = subjResult.termId;
            const predResult    = getTermId.get(_termToRow(quad.predicate));
            if (!predResult) continue;
            quadParam.predicateId = predResult.termId;
            const objResult       = getTermId.get(_termToRow(quad.object));
            if (!objResult) continue;
            quadParam.objectId = objResult.termId;
            const graphResult  = getTermId.get(_termToRow(quad.graph));
            if (!graphResult) continue;
            quadParam.graphId = graphResult.termId;
            const quadResult  = deleteQuads.run(quadParam);
            if (quadResult.changes) {
                deleted++;
                this.emit('deleted', quad);
            }
        }
        return deleted;
    } // SQLiteStore#delete

    async deleteStream(stream) {
        const
            quadStream  = await super.deleteStream(stream),
            getTermId   = this.#statements.getTermId
                || (this.#statements.getTermId = this.#db.prepare(queries.getTermId)),
            deleteQuads = this.#statements.deleteQuads
                || (this.#statements.deleteQuads = this.#db.prepare(queries.deleteQuads));

        let deleted = 0;
        quadStream.on('data', (quad) => {
            const quadParam  = {};
            const subjResult = getTermId.get(_termToRow(quad.subject));
            if (!subjResult) return;
            quadParam.subjectId = subjResult.termId;
            const predResult    = getTermId.get(_termToRow(quad.predicate));
            if (!predResult) return;
            quadParam.predicateId = predResult.termId;
            const objResult       = getTermId.get(_termToRow(quad.object));
            if (!objResult) return;
            quadParam.objectId = objResult.termId;
            const graphResult  = getTermId.get(_termToRow(quad.graph));
            if (!graphResult) return;
            quadParam.graphId = graphResult.termId;
            const quadResult  = deleteQuads.run(quadParam);
            if (quadResult.changes) {
                deleted++;
                this.emit('deleted', quad);
            }
        });

        await new Promise(resolve => quadStream.on('end', resolve));
        return deleted;
    } // SQLiteStore#deleteStream

    async deleteMatches(subject, predicate, object, graph) {
        await super.deleteMatches(subject, predicate, object, graph);
        const
            getTerm   = this.#statements.getTerm
                || (this.#statements.getTerm = this.#db.prepare(queries.getTerm)),
            getTermId = this.#statements.getTermId
                || (this.#statements.getTermId = this.#db.prepare(queries.getTermId)),
            getQuads  = this.#statements.getQuads
                || (this.#statements.getQuads = this.#db.prepare(queries.getQuads)),
            quadParam = {subjectId: null, predicateId: null, objectId: null, graphId: null};
        if (subject) {
            const subjResult = getTermId.get(_termToRow(subject));
            if (!subjResult) return 0;
            quadParam.subjectId = subjResult.termId;
        }
        if (predicate) {
            const predResult = getTermId.get(_termToRow(predicate));
            if (!predResult) return 0;
            quadParam.predicateId = predResult.termId;
        }
        if (object) {
            const objResult = getTermId.get(_termToRow(object));
            if (!objResult) return 0;
            quadParam.objectId = objResult.termId;
        }
        if (graph) {
            const graphResult = getTermId.get(_termToRow(graph));
            if (!graphResult) return 0;
            quadParam.graphId = graphResult.termId;
        }
        const quads = getQuads.all(quadParam).map((quadData) => this.factory.quad(
            subject || _rowToTerm(getTerm.get(quadData.subjectId), this.factory),
            predicate || _rowToTerm(getTerm.get(quadData.predicateId), this.factory),
            object || _rowToTerm(getTerm.get(quadData.objectId), this.factory),
            graph || _rowToTerm(getTerm.get(quadData.graphId), this.factory)
        ));
        return await this.delete(quads);
    } // SQLiteStore#deleteMatches

    async has(quads) {
        const
            quadArr   = await super.has(quads),
            getTermId = this.#statements.getTermId
                || (this.#statements.getTermId = this.#db.prepare(queries.getTermId)),
            getQuads  = this.#statements.getQuads
                || (this.#statements.getQuads = this.#db.prepare(queries.getQuads));

        for (let quad of quadArr) {
            const quadParam  = {};
            const subjResult = getTermId.get(_termToRow(quad.subject));
            if (!subjResult) return false;
            quadParam.subjectId = subjResult.termId;
            const predResult    = getTermId.get(_termToRow(quad.predicate));
            if (!predResult) return false;
            quadParam.predicateId = predResult.termId;
            const objResult       = getTermId.get(_termToRow(quad.object));
            if (!objResult) return false;
            quadParam.objectId = objResult.termId;
            const graphResult  = getTermId.get(_termToRow(quad.graph));
            if (!graphResult) return false;
            quadParam.graphId = graphResult.termId;
            const quadResult  = getQuads.get(quadParam);
            if (!quadResult) return false;
        }
        return true;
    } // SQLiteStore#has

    async setupTables() {
        this.#db.exec(queries.setupTables);
    } // SQLiteStore#setupTables

    async clearLooseNodes() {
        assert(false, 'not implemented');
        // TODO
    } // SQLiteStore#clearLooseNodes

} // SQLiteStore

module.exports = SQLiteStore;
