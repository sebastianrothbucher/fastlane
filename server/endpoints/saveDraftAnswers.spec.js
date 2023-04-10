const saveDraftAnswers = require('./saveDraftAnswers');

describe('saveDraftAnswers', () => {

    let req, res, dao, repo;

    beforeEach(() => {
        req = {
            user: 'test@bla.com',
            path: 'saveDrafts/lane123',
            body: { // app.use(express.json())
                question_answers: [
                    'hey',
                ],
                sthElse: 42, // must NOT be in saved
                version: 2,
            },
        };
        res = {
            status: jest.fn(),
            json: jest.fn(),
        };
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        dao = {
            getLane: jest.fn(),
            saveLane: jest.fn(),
        };
        dao.getLane.mockReturnValue({
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
        await expect(saveDraftAnswers(req, res, dao, repo)).rejects.toThrow('need user');
    });
    it('needs a path with an ID', async () => {
        req.path = '';
        await saveDraftAnswers(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(400);
        expect(res.json.mock.calls[0][0]?.msg).toBe('No ID');
    });
    it('needs user permissions', async () => {
        dao.getLane.mockReturnValue({ permissions: null });
        await saveDraftAnswers(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(403);
    });
    it('needs correct user', async () => {
        dao.getLane.mockReturnValue({ permissions: ['other@test.com'] });
        await saveDraftAnswers(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(403);
    });
    it('needs correct version', async () => {
        req.body.version = 3;
        await saveDraftAnswers(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(409);
        expect(res.json.mock.calls[0][0]?.msg).toMatch(/mismatch/i);
    });
    it('does not save after submission', async () => {
        dao.getLane.mockReturnValue({
            version: 2,
            sthAlreadyIn: 43, // must STAY & NOT be returned
            phase: 'p',
            permissions: ['test@bla.com'],
        });
        await saveDraftAnswers(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(400);
    });

    it('saves the draft state', async () => {
        await saveDraftAnswers(req, res, dao, repo);
        expect(dao.getLane.mock.calls.length).toBe(1);
        expect(dao.getLane.mock.calls[0][0]).toBe('lane123');
        expect(dao.saveLane.mock.calls.length).toBe(1);
        expect(dao.saveLane.mock.calls[0][0].question_answers).toBeDefined();
        expect(dao.saveLane.mock.calls[0][0].sthElse).not.toBeDefined();
        expect(dao.saveLane.mock.calls[0][0].sthAlreadyIn).toBe(43);
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(res.json.mock.calls[0][0]).toBeDefined();
        expect(res.json.mock.calls[0][0].ok).toBe(true);
        expect(res.json.mock.calls[0][0].version).toBeDefined();
    });
});
