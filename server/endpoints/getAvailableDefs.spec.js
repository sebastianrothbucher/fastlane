const getAvailableDefs = require('./getAvailableDefs');

describe('getAvailableDefs', () => {

    let req, res, repo;

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
        repo = {
            getLaneDefs: jest.fn(),
        };
        repo.getLaneDefs.mockReturnValue({'lane1def': {
            title: 'Lane 1 def',
            description: 'Lane 1 desc',
            sthAlreadyIn: 43, // must STAY & NOT be returned
            permissions: ['test@bla.com'],
        }});
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(getAvailableDefs(req, res, null, repo)).rejects.toThrow('need user');
    });
    it('returns reduced version of lane defs', async () => {
        await getAvailableDefs(req, res, null, repo);
        expect(res.json.mock.calls[0][0]?.ok).toBe(true);
        expect(res.json.mock.calls[0][0]?.lanes).toBeDefined();
        expect(res.json.mock.calls[0][0].lanes.length).toBe(1);
        expect(res.json.mock.calls[0][0].lanes[0].typeName).toBe('lane1def');
        expect(res.json.mock.calls[0][0].lanes[0].title).toBe('Lane 1 def');
        expect(res.json.mock.calls[0][0].lanes[0].description).toBe('Lane 1 desc');
        expect(res.json.mock.calls[0][0].lanes[0].sthAlreadyIn).toBeUndefined();
        expect(res.json.mock.calls[0][0].lanes[0].permissions).toBeUndefined();
    });
    it('returns only lanes matching users', async () => {
        req.user = 'test@else.com';
        await getAvailableDefs(req, res, null, repo);
        expect(res.json.mock.calls[0][0]?.ok).toBe(true);
        expect(res.json.mock.calls[0][0]?.lanes).toBeDefined();
        expect(res.json.mock.calls[0][0].lanes.length).toBe(0);        
    });
});