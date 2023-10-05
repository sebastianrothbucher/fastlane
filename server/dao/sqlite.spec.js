const tmp = require('tmp');
const sqlite = require('better-sqlite3');
const dao = require('./sqlite');

describe('sqlite-dao', () => {

    let dbTmp;
    let db;

    beforeEach(async () => {
        dbTmp = tmp.fileSync();
        await dao.init(dbTmp.name);
        db = sqlite(dbTmp.name, {readonly: true});
    });
    afterEach(async () => {
        db.close();
        dao.shutdown();
        dbTmp.removeCallback();
    });

    it('creates a lane', async () => {
        const createdLane = await dao.createLane({
            someAttr: true,
            permissions: ['test@bla.com'],
        }, 'merrylane');
        const laneCount = db.prepare('select count(*) as cnt from lanes').get().cnt;
        expect(laneCount).toBe(1);
        const thisLane = db.prepare('select * from lanes').get();
        expect(thisLane.id).toBeDefined();
        expect(thisLane.id.length).toBe(36); // uuidv4
        expect(thisLane.typeName).toBe('merrylane');
        expect(thisLane.version).toBe(1);
        expect(thisLane.content).toBeDefined();
        const thisLaneParsed = JSON.parse(thisLane.content);
        expect(thisLaneParsed.id).toBe(thisLane.id);
        expect(thisLaneParsed.typeName).toBe('merrylane');
        expect(thisLaneParsed.version).toBe(1);
        expect(thisLaneParsed.createdAt).toBeDefined();
        expect(thisLaneParsed.updatedAt).toBeDefined();
        expect(thisLaneParsed.someAttr).toBe(true);
        expect(createdLane).toBeDefined();
        expect(createdLane.id).toBe(thisLane.id);
        expect(createdLane.typeName).toBe('merrylane');
        expect(createdLane.version).toBe(1);
        expect(createdLane.createdAt).toBeDefined();
        expect(createdLane.updatedAt).toBeDefined();
        expect(createdLane.someAttr).toBe(true);
    });
    it('needs lane permissions', async () => {
        await expect(dao.createLane({
            someAttr: true,
            // no permissions
        })).rejects.toThrow();
    });

    it('saves an existing lane', async () => {
        const initLane = await dao.createLane({
            someAttr: true,
            permissions: ['test@bla.com'],
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // make sure updatedAt is different
        initLane.someOtherAttr = true;
        const updatedLane = await dao.saveLane(initLane);
        expect(updatedLane).toBeDefined();
        expect(updatedLane.id).toBe(initLane.id);
        expect(updatedLane.version).toBe(2);
        expect(updatedLane.someAttr).toBe(true);
        expect(updatedLane.someOtherAttr).toBe(true);
        expect(updatedLane.updatedAt > updatedLane.createdAt).toBe(true);
        const thisLane = db.prepare('select * from lanes where id=?').get([initLane.id]);
        expect(thisLane.id).toBe(initLane.id);
        expect(thisLane.version).toBe(2);
        expect(thisLane.content).toBeDefined();
        const thisLaneParsed = JSON.parse(thisLane.content);
        expect(thisLaneParsed.someAttr).toBe(true);
        expect(thisLaneParsed.someOtherAttr).toBe(true);
        expect(thisLaneParsed.updatedAt > thisLaneParsed.createdAt).toBe(true);
    });
    it('saves with ID and version', async () => {
        await expect(dao.saveLane({
            // no ID
            version: 42,
        })).rejects.toThrow();
        await expect(dao.saveLane({
            id: '0815',
            // no version
        })).rejects.toThrow();
    });
    it('recognizes version conflicts', async () => {
        const initLane = await dao.createLane({
            someAttr: true,
            permissions: ['test@bla.com'],
        });
        initLane.version = 8;
        expect(dao.saveLane(initLane)).rejects.toThrow('Version error');
    });

    it('gets lanes by email deserialized', async () => {
        await dao.createLane({
            someAttr: 'L1',
            permissions: ['test@bla.com'],
        });
        await dao.createLane({
            someAttr: 'L2',
            permissions: ['othertest@bla.com'],
        });
        await dao.createLane({
            someAttr: 'L3',
            permissions: ['other@bla.com'],
        });
        const lanes = await dao.getLanes('test@bla.com');
        expect(lanes.length).toBe(1);
        expect(lanes[0].someAttr).toBe('L1');
    });
    it('needs email to get lanes', async () => {
        expect(dao.getLanes(null)).rejects.toThrow();
    });

    it('gets all lanes deserialized', async () => {
        await dao.createLane({
            someAttr: 'L1',
            permissions: ['test@bla.com'],
        });
        await dao.createLane({
            someAttr: 'L2',
            permissions: ['othertest@bla.com'],
        });
        const lanes = await dao.getAllLanes();
        expect(lanes.length).toBe(2);
        expect(lanes[0].someAttr.substring(0, 1)).toBe('L');
        expect(lanes[1].someAttr.substring(0, 1)).toBe('L');
    });

    it('gets lane by ID deserialized', async () => {
        const initLane1 = await dao.createLane({
            someAttr: 'L1',
            permissions: ['test@bla.com'],
        });
        await dao.createLane({
            someAttr: 'L2',
            permissions: ['othertest@bla.com'],
        }); // just 2b sure we get the right one
        const lane = await dao.getLane(initLane1.id);
        expect(lane.id).toBe(initLane1.id);
        expect(lane.someAttr).toBe('L1');
    });
    it('needs ID to load a lane', async () => {
        expect(dao.getLane(null)).rejects.toThrow();
    });
    it('can handle non-existing lane', async () => {
        const lane = await dao.getLane('L111');
        expect(lane).toBeNull();
    });

    it('creates a landing', async () => {
        const createdLanding = await dao.createLanding({
            someAttr: true,
            permissions: ['test@bla.com'],
        });
        const landingCount = db.prepare('select count(*) as cnt from landings').get().cnt;
        expect(landingCount).toBe(1);
        const thisLanding = db.prepare('select * from landings').get();
        expect(thisLanding.id).toBeDefined();
        expect(thisLanding.id.length).toBe(36); // uuidv4
        expect(thisLanding.version).toBe(1);
        expect(thisLanding.content).toBeDefined();
        const thisLandingParsed = JSON.parse(thisLanding.content);
        expect(thisLandingParsed.id).toBe(thisLanding.id);
        expect(thisLandingParsed.version).toBe(1);
        expect(thisLandingParsed.createdAt).toBeDefined();
        expect(thisLandingParsed.updatedAt).toBeDefined();
        expect(thisLandingParsed.someAttr).toBe(true);
        expect(createdLanding).toBeDefined();
        expect(createdLanding.id).toBe(thisLanding.id);
        expect(createdLanding.version).toBe(1);
        expect(createdLanding.createdAt).toBeDefined();
        expect(createdLanding.updatedAt).toBeDefined();
        expect(createdLanding.someAttr).toBe(true);
    });

    it('gets landings by email deserialized', async () => {
        await dao.createLanding({
            someAttr: 'L1',
            permissions: ['test@bla.com'],
        });
        await dao.createLanding({
            someAttr: 'L2',
            permissions: ['othertest@bla.com'],
        });
        await dao.createLanding({
            someAttr: 'L3',
            permissions: ['other@bla.com'],
        });
        const landings = await dao.getLandings('test@bla.com');
        expect(landings.length).toBe(1);
        expect(landings[0].someAttr).toBe('L1');
    });
    it('needs email to get landings', async () => {
        expect(dao.getLandings(null)).rejects.toThrow();
    });

    it('gets all landings deserialized', async () => {
        await dao.createLanding({
            someAttr: 'L1',
            permissions: ['test@bla.com'],
        });
        await dao.createLanding({
            someAttr: 'L2',
            permissions: ['othertest@bla.com'],
        });
        const lanes = await dao.getAllLandings();
        expect(lanes.length).toBe(2);
        expect(lanes[0].someAttr.substring(0, 1)).toBe('L');
        expect(lanes[1].someAttr.substring(0, 1)).toBe('L');
    });

    it('logs limited use also repeated', async () => {
        await dao.logLimitedUse('0815', 'testres', 'opt1');
        const resResCount1 = db.prepare('select count(*) as cnt from limitedUse').get().cnt;
        expect(resResCount1).toBe(1);
        const resRes1 = db.prepare('select count from limitedUse where laneId=? and resId=?').get(['0815', 'testres']);
        expect(resRes1).toBeDefined();
        expect(resRes1.count).toBe(1);
        await dao.logLimitedUse('0816', 'testres', 'opt1', 2);
        const resResCount2 = db.prepare('select count(*) as cnt from limitedUse').get().cnt;
        expect(resResCount2).toBe(2);
        const resRes2 = db.prepare('select count from limitedUse where laneId=? and resId=?').get(['0816', 'testres']);
        expect(resRes2).toBeDefined();
        expect(resRes2.count).toBe(2);
        const resLoad = await dao.getLimitedUse('testres');
        expect(resLoad.length).toBe(1);
        expect(resLoad[0].id).toBe('opt1');
        expect(resLoad[0].count).toBe(3);
    });
});