const getAllLandings = require('./getAllLandings');

describe('getAllLandings', () => {

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
            getAllLandings: jest.fn(),
        }
        dao.getAllLandings.mockReturnValue([{
            id: 'landing456',
            template: 'testtemplate',
            title: 'Landing 456',
            version: 2,
            links: [{link: 'http://from-landing'}],
            sthAlreadyIn: 43, // must STAY & NOT be returned
            permissions: ['test@bla.com'],
        }]);
        repo = {
            getAdmins: () => (['admin@bla.com']),
            getLandings: () => ([{title: 'Landing from static'}]),
            getLandingTemplates: () => ({'testtemplate': {title: 'Title from template', briefing: 'Briefing from template', links: [{link: 'http://from-template'}]}}),
        };
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(getAllLandings(req, res, dao, repo)).rejects.toThrow('need user');
    });
    it('returns landings', async () => {
        await getAllLandings(req, res, dao, repo);
        expect(res.json.mock.calls[0][0]?.ok).toBe(true);
        expect(res.json.mock.calls[0][0]?.landings).toBeDefined();
        expect(res.json.mock.calls[0][0].landings.length).toBe(2);
        expect(res.json.mock.calls[0][0].landings[0].id).toBe('landing456');
        expect(res.json.mock.calls[0][0].landings[0].template).toBe('testtemplate');
        expect(res.json.mock.calls[0][0].landings[0].title).toBe('Landing 456');
        expect(res.json.mock.calls[0][0].landings[0].briefing).toBe('Briefing from template');
        expect(res.json.mock.calls[0][0].landings[0].links.length).toBe(2);
        expect(res.json.mock.calls[0][0].landings[0].links[0].link).toBe('http://from-landing');
        expect(res.json.mock.calls[0][0].landings[0].links[1].link).toBe('http://from-template');
        expect(res.json.mock.calls[0][0].landings[0].sthAlreadyIn).toBeUndefined();
        expect(res.json.mock.calls[0][0].landings[0].permissions).toBeDefined();
        expect(res.json.mock.calls[0][0].landings[1].title).toBe('Landing from static');
    });
    it('returns only landings for admins', async () => {
        req.user = 'test@else.com';
        await getAllLandings(req, res, dao, repo);
        expect(res.json.mock.calls[0][0]?.ok).toBe(false);
        expect(res.status.mock.calls[0][0]).toBe(403);
    });
});