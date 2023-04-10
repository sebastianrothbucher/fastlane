const getLimitedSlots = require('./getLimitedSlots');

describe('getLimitedSlots', () => {

    let req, res, dao, repo;

    beforeEach(() => {
        req = {
            user: 'test@bla.com',
            path: 'getLimitedSlots/limited123'
        };
        res = {
            status: jest.fn(),
            json: jest.fn(),
        };
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        dao = {
            getLimitedUse: jest.fn(),
        };
        dao.getLimitedUse.mockReturnValue([
            {id: 'opt1', count: 2},
            {id: 'opt2', count: 1},
        ]);
        repo = {
            getAdmins: () => ([]),
            getLimitedRes: () => ({
                'limited123': [
                    {id: 'opt1', count: 5},
                    {id: 'opt2', count: 1},
                    {id: 'opt3', count: 1},
                ],
            }),
        };
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(getLimitedSlots(req, res, dao, repo)).rejects.toThrow('need user');
    });
    it('needs a path with an ID', async () => {
        req.path = '';
        await getLimitedSlots(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(400);
        expect(res.json.mock.calls[0][0]?.msg).toBe('No ID');
    });
    it('alerts on not found', async () => {
        repo.getLimitedRes = () => ({});
        await getLimitedSlots(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(404);
    });

    it('returns possible options', async () => {
        await getLimitedSlots(req, res, dao, repo);
        expect(res.json.mock.calls[0][0]).toBeDefined();
        expect(res.json.mock.calls[0][0].ok).toBe(true);
        expect(res.json.mock.calls[0][0].options).toBeDefined()
        expect(res.json.mock.calls[0][0].options.length).toBe(2);
        expect(res.json.mock.calls[0][0].options[0].id).toBe('opt1');
        expect(res.json.mock.calls[0][0].options[1].id).toBe('opt3');
    });

});