const fs = require('fs');
const uuidV4 = require('uuid').v4;
const sqlite = require('better-sqlite3');
let db;

const dao = { // max-simple DAO, atomic ops all around (make async to be prepped)
    async init(dbName) { // create table if not exists
        db = sqlite(dbName || 'db.sqlite');
        const initSql = fs.readFileSync('dao/sqlite-schema.sql', 'utf-8');
        db.exec(initSql);
    },
    async shutdown() { // (mainly test; otherwise: one inst for life of node process)
        if (db) {
            db.close();
            db = null;
        }
    },
    async createLane(lane, typeName) {
        if (!lane) {
            throw new Error('lane is required');
        }
        if (!(Array.isArray(lane.permissions) && (lane.permissions.length > 0))) {
            throw new Error('Lane needs permissions');
        }
        lane.id = uuidV4();
        lane.typeName = typeName || null;
        lane.version = 1;
        const now = new Date().toISOString();
        lane.createdAt = now;
        lane.updatedAt = now;
        const insertInfo = db.prepare('insert into lanes (id, typeName, content, version, createdAt, updatedAt) values (?, ?, ?, ?, ?, ?)')
            .run(lane.id, typeName || null, JSON.stringify(lane), lane.version, now, now);
        if (insertInfo.changes !== 1) {
            throw new Error('Inserting lane failed');
        }
        return lane;
    },
    async saveLane(lane) {
        if (!lane) {
            throw new Error('lane is required');
        }
        if (!lane.id) {
            throw new Error('Lane needs an ID');
        }
        if (!lane.version) {
            throw new Error('Lane needs a version');
        }
        const currentVersion = lane.version;
        lane.version++;
        const now = new Date().toISOString();
        lane.updatedAt = now;
        const updateInfo = db.prepare('update lanes set content=?, version=?, updatedAt=? where id=? and version=?')
            .run(JSON.stringify(lane), lane.version, now, lane.id, currentVersion);
        if (updateInfo.changes !== 1) {
            const otherVersionInfo = db.prepare('select count(*) as cnt from lanes where id=? and version<>?')
                .get(lane.id, currentVersion);
            if (otherVersionInfo.cnt === 1) {
                throw new Error('Version error');
            } else {
                throw new Error('Updating lane failed');
            }
        }
        return lane;
    },
    async getLanes(permittedEmail) {
        if (!permittedEmail) {
            throw new Error('Need an account to search permissions');
        }
        const lanesRaw = db.prepare('select content from lanes where content like ? order by updatedAt desc')
            .all('%' + permittedEmail + '%');
        const lanes = lanesRaw.map(lr => JSON.parse(lr.content))
            .filter(l => (l.permissions || []).includes(permittedEmail)); // (don't fall for fragments or sth)
        return lanes;
    },
    async getAllLanes() {
        const lanesRaw = db.prepare('select content from lanes where 1=1 order by updatedAt desc').all();
        const lanes = lanesRaw.map(lr => JSON.parse(lr.content));
        return lanes;
    },
    async getLane(id) {
        if (!id) {
            throw new Error('id is required');
        }
        const laneRaw = db.prepare('select content from lanes where id=?').get(id);
        if (laneRaw) {
            const lane = JSON.parse(laneRaw.content);
            return lane;cnt
        } else {
            return null;
        }
    },
    async logLimitedUse(laneId, resId, resOptionId, count) {
        if (!laneId) {
            throw new Error('laneId is required');
        }
        if (!resId) {
            throw new Error('resId is required');
        }
        if (!resOptionId) {
            throw new Error('resOptionId is required');
        }
        const now = new Date().toISOString();
        db.prepare('insert into limitedUse (laneId, resId, resOptionId, count, createdAt) values (?, ?, ?, ?, ?)')
            .run(laneId, resId, resOptionId, count || 1, now);
    },
    async getLimitedUse(resId) {
        if (!resId) {
            throw new Error('resId is required');
        }
        const used = db.prepare('select resOptionId, sum(count) as cnt from limitedUse where resId=? group by resOptionId')
            .all(resId).map(or => ({id: or.resOptionId, count: or.cnt}));
        return used;
    },
};

module.exports = dao;
