const createLanding = require('./createLanding');

describe('createLanding', () => {

    let req, res, dao, repo;

    beforeEach(() => {
        req = {
            user: 'admin@bla.com',
            query: {
                forUsers: 'test@bla.com,another@bla.com',
            },
            body: {
            },
        };
        res = {
            status: jest.fn(),
            json: jest.fn(),
        };
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        dao = {
            createLanding: jest.fn(),
        };
        dao.createLanding.mockImplementation((newLanding) => newLanding);
        repo = {
            getAdmins: () => (['admin@bla.com']),
        };
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(createLanding(req, res, dao, repo)).rejects.toThrow('need user');
    });
    it('needs an admin user', async () => {
        req.user = 'test@bla.com'
        await createLanding(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(403);
        expect(dao.createLanding.mock.calls.length).toBe(0);
    });
    it('needs an exissting and complete def', async () => {
        req.query.template = null;
        req.body.template = null;
        req.body.links = null;
        await createLanding(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(400);
        expect(dao.createLanding.mock.calls.length).toBe(0);
    });

    it('does create for any user by param only', async () => {
        req.query.template = 'testtemplate';
        await createLanding(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(res.json.mock.calls[0][0].ok).toBe(true);
        expect(res.json.mock.calls[0][0].landing.template).toBe('testtemplate');
        expect(res.json.mock.calls[0][0].landing.permissions.length).toBe(2);
        expect(res.json.mock.calls[0][0].landing.permissions[1]).toBe('another@bla.com');
        expect(res.json.mock.calls[0][0].landing.createdBy).toBe('admin@bla.com');
        expect(dao.createLanding.mock.calls.length).toBe(1);
        expect(dao.createLanding.mock.calls[0][0].template).toBe('testtemplate');
    });
    it('does create for any user by body with template', async () => {
        req.body.template = 'testtemplate';
        req.body.links = [{link: 'https://bla', title: 'bla'}];
        await createLanding(req, res, dao, repo);
        expect(res.status.mock.calls.length).toBe(1);
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(res.json.mock.calls[0][0].ok).toBe(true);
        expect(res.json.mock.calls[0][0].landing.template).toBe('testtemplate');
        expect(res.json.mock.calls[0][0].landing.links?.length).toBe(1);
        expect(res.json.mock.calls[0][0].landing.permissions.length).toBe(2);
        expect(res.json.mock.calls[0][0].landing.permissions[1]).toBe('another@bla.com');
        expect(res.json.mock.calls[0][0].landing.createdBy).toBe('admin@bla.com');
        expect(dao.createLanding.mock.calls.length).toBe(1);
        expect(dao.createLanding.mock.calls[0][0].template).toBe('testtemplate');
        expect(dao.createLanding.mock.calls[0][0].links?.length).toBe(1);
    });
});
