const getUserLandings = require('./getUserLandings');

describe('getUserLandings', () => {

    let req, res, dao, repo;

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
            getLandings: jest.fn(),
        };
        dao.getLandings.mockReturnValue([{
            id: 'landing234',
            template: 'testtemplate',
            title: 'Landing 234',
            version: 2,
            links: [{link: 'http://from-landing'}],
            sthAlreadyIn: 43, // must STAY & NOT be returned
            permissions: ['test@bla.com'],
        }]);
        repo = {
            getLandings: () => ([{title: 'Landing from static', permissions: ['test@bla.com']}, {title: 'Another Landing from static', permissions: ['soelse@bla.com']}]),
            getLandingTemplates: () => ({'testtemplate': {title: 'Title from template', briefing: 'Briefing from template', links: [{link: 'http://from-template'}]}}),
        };
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(getUserLandings(req, res, dao, null)).rejects.toThrow('need user');
    });

    it('returns user lanes', async () => {
        await getUserLandings(req, res, dao, repo);
        expect(dao.getLandings.mock.calls.length).toBe(1);
        expect(dao.getLandings.mock.calls[0][0]).toBe('test@bla.com');
        expect(res.json.mock.calls[0][0]?.ok).toBe(true);
        expect(res.json.mock.calls[0][0]?.landings).toBeDefined();
        expect(res.json.mock.calls[0][0].landings.length).toBe(2);
        expect(res.json.mock.calls[0][0].landings[0].id).toBe('landing234');
        expect(res.json.mock.calls[0][0].landings[0].template).toBe('testtemplate');
        expect(res.json.mock.calls[0][0].landings[0].title).toBe('Landing 234');
        expect(res.json.mock.calls[0][0].landings[0].briefing).toBe('Briefing from template');
        expect(res.json.mock.calls[0][0].landings[0].links.length).toBe(2);
        expect(res.json.mock.calls[0][0].landings[0].links[0].link).toBe('http://from-landing');
        expect(res.json.mock.calls[0][0].landings[0].links[1].link).toBe('http://from-template');
        expect(res.json.mock.calls[0][0].landings[0].sthAlreadyIn).toBeUndefined();
        expect(res.json.mock.calls[0][0].landings[1].title).toBe('Landing from static');
    });
});