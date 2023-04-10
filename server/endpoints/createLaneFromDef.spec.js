const createLaneFromDef = require('./createLaneFromDef');

describe('createLaneFromDef', () => {

    let req, res, dao, repo;

    beforeEach(() => {
        req = {
            user: 'test@bla.com',
            query: {
                typeName: 'lane42def',
                forUsers: 'test@bla.com,another@bla.com'
            },
        };
        res = {
            status: jest.fn(),
            json: jest.fn(),
        };
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        dao = {
            createLane: jest.fn(),
        };
        dao.createLane.mockImplementation((newLane, typeName) => ({...newLane, typeName: typeName}));
        repo = {
            getAdmins: () => (['admin@bla.com']),
            getLaneDefs: () => ({
                'lane42def': {
                    title: 'Lane 42 def',
                    permissions: ['test@bla.com']
                },
            }),
        };
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(createLaneFromDef(req, res, dao, repo)).rejects.toThrow('need user');
    });
    it('needs a typeName', async () => {
        req.query.typeName = null;
        await createLaneFromDef(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(400);
        expect(dao.createLane.mock.calls.length).toBe(0);
    });
    it('needs an exissting def', async () => {
        req.query.typeName = 'sthelse';
        await createLaneFromDef(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(404);
        expect(dao.createLane.mock.calls.length).toBe(0);
    });
    it('needs user to have permission', async () => {
        req.query.typeName = 'test@else.com';
        await createLaneFromDef(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(404);
        expect(dao.createLane.mock.calls.length).toBe(0);
    });

    it('does create for user itself', async () => {
        await createLaneFromDef(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(res.json.mock.calls[0][0].ok).toBe(true);
        expect(res.json.mock.calls[0][0].lane.typeName).toBe('lane42def');
        expect(res.json.mock.calls[0][0].lane.title).toBe('Lane 42 def');
        expect(res.json.mock.calls[0][0].lane.permissions.length).toBe(2);
        expect(res.json.mock.calls[0][0].lane.permissions[1]).toBe('another@bla.com');
        expect(res.json.mock.calls[0][0].lane.createdBy).toBe('test@bla.com');
        expect(dao.createLane.mock.calls.length).toBe(1);
        expect(dao.createLane.mock.calls[0][0].title).toBe('Lane 42 def');
    });
    it('does create with different title ', async () => {
        req.query.title = 'another title';
        await createLaneFromDef(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(dao.createLane.mock.calls.length).toBe(1);
        expect(dao.createLane.mock.calls[0][0].title).toBe('another title');
    });
    it('does not create for only other ', async () => {
        req.query.forUsers = 'another@bla.com';
        await createLaneFromDef(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(403);
        expect(dao.createLane.mock.calls.length).toBe(0);
    });
    it('does create for any user as admin', async () => {
        req.user = 'admin@bla.com';
        req.query.forUsers = 'yetanother@bla.com';
        await createLaneFromDef(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(dao.createLane.mock.calls.length).toBe(1);
    });
});
