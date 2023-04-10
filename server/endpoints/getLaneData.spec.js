const getLaneData = require('./getLaneData');

describe('getLaneData', () => {

    let req, res, dao, repo;

    beforeEach(() => {
        req = {
            user: 'test@bla.com',
            path: 'getLaneData/lane123'
        };
        res = {
            status: jest.fn(),
            json: jest.fn(),
        };
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        dao = {
            getLane: jest.fn(),
        };
        dao.getLane.mockReturnValue({
            id: 'lane345',
            version: 2,
            sthAlreadyIn: 43, // must STAY & NOT be returned
            phase: 'q',
            permissions: ['test@bla.com'],
        });
        repo = {
            getAdmins: () => ([]),
        };
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(getLaneData(req, res, dao, repo)).rejects.toThrow('need user');
    });
    it('needs a path with an ID', async () => {
        req.path = '';
        await getLaneData(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(400);
        expect(res.json.mock.calls[0][0]?.msg).toBe('No ID');
    });
    it('needs user permissions', async () => {
        dao.getLane.mockReturnValue({ permissions: null });
        await getLaneData(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(403);
    });
    it('alerts on not found', async () => {
        dao.getLane.mockReturnValue(null);
        await getLaneData(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(404);
    });
    it('needs correct user', async () => {
        dao.getLane.mockReturnValue({ permissions: ['other@test.com'] });
        await getLaneData(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(403);
    });
    it('takes admin in lieu user permissions', async () => {
        repo.getAdmins = () => (['test@bla.com']),
        dao.getLane.mockReturnValue({
            version: 2,
            permissions: null,
        });
        await getLaneData(req, res, dao, repo);
        expect(res.json.mock.calls[0][0]?.ok).toBe(true);
        expect(res.json.mock.calls[0][0]?.lane).toBeDefined();
    });

    it('returns lanes data', async () => {
        await getLaneData(req, res, dao, repo);
        expect(dao.getLane.mock.calls.length).toBe(1);
        expect(dao.getLane.mock.calls[0][0]).toBe('lane123');
        expect(res.json.mock.calls[0][0]).toBeDefined();
        expect(res.json.mock.calls[0][0].ok).toBe(true);
        expect(res.json.mock.calls[0][0].lane).toBeDefined();
        expect(res.json.mock.calls[0][0].lane.id).toBe('lane345');
        expect(res.json.mock.calls[0][0].lane.sthAlreadyIn).not.toBeDefined();
    });

});