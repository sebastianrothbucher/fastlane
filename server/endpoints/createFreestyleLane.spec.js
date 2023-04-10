const createFreestyleLane = require('./createFreestyleLane');

describe('createFreestyleLane', () => {

    let req, res, dao, repo;

    beforeEach(() => {
        req = {
            user: 'admin@bla.com',
            query: {
                forUsers: 'test@bla.com,another@bla.com',
                title: 'another title',
            },
            body: {
                questions: [{id: 'q1'}],
                endpoint: {type: 'test'},
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
        dao.createLane.mockImplementation((newLane) => newLane);
        repo = {
            getAdmins: () => (['admin@bla.com']),
        };
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(createFreestyleLane(req, res, dao, repo)).rejects.toThrow('need user');
    });
    it('needs an admin user', async () => {
        req.user = 'test@bla.com'
        await createFreestyleLane(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(403);
        expect(dao.createLane.mock.calls.length).toBe(0);
    });
    it('needs an exissting and complete def', async () => {
        req.body.questions = null;
        await createFreestyleLane(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(400);
        expect(dao.createLane.mock.calls.length).toBe(0);
    });

    it('does create for any user', async () => {
        await createFreestyleLane(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(res.json.mock.calls[0][0].ok).toBe(true);
        expect(res.json.mock.calls[0][0].lane.title).toBe('another title');
        expect(res.json.mock.calls[0][0].lane.questions).toBeDefined();
        expect(res.json.mock.calls[0][0].lane.endpoint).toBeDefined();
        expect(res.json.mock.calls[0][0].lane.permissions.length).toBe(2);
        expect(res.json.mock.calls[0][0].lane.permissions[1]).toBe('another@bla.com');
        expect(res.json.mock.calls[0][0].lane.createdBy).toBe('admin@bla.com');
        expect(dao.createLane.mock.calls.length).toBe(1);
        expect(dao.createLane.mock.calls[0][0].title).toBe('another title');
    });
});
