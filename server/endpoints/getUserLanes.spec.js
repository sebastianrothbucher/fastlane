const getUserLanes = require('./getUserLanes');

describe('getUserLanes', () => {

    let req, res, dao;

    beforeEach(() => {
        req = {
            user: 'test@bla.com',
        };
        res = {
            status: jest.fn(),
            json: jest.fn(),
        };
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        dao = {
            getLanes: jest.fn(),
        };
        dao.getLanes.mockReturnValue([{
            id: 'lane234',
            version: 2,
            sthAlreadyIn: 43, // must STAY & NOT be returned
            phase: 'q',
            permissions: ['test@bla.com'],
        }]);
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(getUserLanes(req, res, dao, null)).rejects.toThrow('need user');
    });

    it('returns user lanes', async () => {
        await getUserLanes(req, res, dao, null);
        expect(dao.getLanes.mock.calls.length).toBe(1);
        expect(dao.getLanes.mock.calls[0][0]).toBe('test@bla.com');
        expect(res.json.mock.calls[0][0]).toBeDefined();
        expect(res.json.mock.calls[0][0].ok).toBe(true);
        expect(res.json.mock.calls[0][0].lanes.length).toBe(1);
        expect(res.json.mock.calls[0][0].lanes[0].id).toBe('lane234');
        expect(res.json.mock.calls[0][0].lanes[0].sthAlreadyIn).not.toBeDefined();
    });
});