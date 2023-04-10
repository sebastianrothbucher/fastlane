const getAllLanes = require('./getAllLanes');

describe('getAllLanes', () => {

    let req, res, dao, repo;

    beforeEach(() => {
        req = {
            user: 'admin@bla.com',
        };
        res = {
            status: jest.fn(),
            json: jest.fn(),
        };
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        dao = {
            getAllLanes: jest.fn(),
        }
        dao.getAllLanes.mockReturnValue([{
            typeName: 'lane1def',
            id: 'lane456',
            title: 'Lane 456',
            version: 2,
            sthAlreadyIn: 43, // must STAY & NOT be returned
            permissions: ['test@bla.com'],
        }]);
        repo = {
            getAdmins: () => (['admin@bla.com'])
        };
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(getAllLanes(req, res, dao, repo)).rejects.toThrow('need user');
    });
    it('returns reduced version of lanes', async () => {
        await getAllLanes(req, res, dao, repo);
        expect(res.json.mock.calls[0][0]?.ok).toBe(true);
        expect(res.json.mock.calls[0][0]?.lanes).toBeDefined();
        expect(res.json.mock.calls[0][0].lanes.length).toBe(1);
        expect(res.json.mock.calls[0][0].lanes[0].typeName).toBe('lane1def');
        expect(res.json.mock.calls[0][0].lanes[0].id).toBe('lane456');
        expect(res.json.mock.calls[0][0].lanes[0].title).toBe('Lane 456');
        expect(res.json.mock.calls[0][0].lanes[0].sthAlreadyIn).toBeUndefined();
        expect(res.json.mock.calls[0][0].lanes[0].permissions).toBeDefined();
    });
    it('returns only lanes for admins', async () => {
        req.user = 'test@else.com';
        await getAllLanes(req, res, dao, repo);
        expect(res.json.mock.calls[0][0]?.ok).toBe(false);
        expect(res.status.mock.calls[0][0]).toBe(403);
    });
});