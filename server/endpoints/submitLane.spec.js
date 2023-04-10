jest.mock('../utils/utils', () => ({ // (this file only)
    processAnswer: () => 'test-processed',
    workReservations: jest.fn(),
}));
const utils = require('../utils/utils');

const submitLane = require('./submitLane');

describe('submitLane', () => {

    let req, res, dao, repo;
    let fetchMock, fetchReal;

    beforeEach(() => {
        req = {
            user: 'test@bla.com',
            path: 'submit/lane123',
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
            logLimitedUse: jest.fn(),
        };
        dao.getLane.mockReturnValue({
            id: 'lane123',
            endpoint: {
                type: 'api',
                endpoint: 'https://bla',
                format: 'text',
            },
            version: 2,
            sthAlreadyIn: 43, // must STAY & NOT be returned
            phase: 'q',
            permissions: ['test@bla.com'],
        });
        repo = {
            getAdmins: () => ([]),
        };
        fetchReal = globalThis.fetch;
        fetchMock = jest.fn();
        fetchMock.mockReturnValue(Promise.resolve({ text: () => Promise.resolve('API-Res') }));
        globalThis.fetch = fetchMock;
        utils.workReservations.mockReturnValue({reservations: []});
    });
    afterEach(() => {
        globalThis.fetch = fetchReal;
        utils.workReservations.mockReset();
    });

    it('needs a user', async () => {
        req.user = null;
        await expect(submitLane(req, res, dao, repo)).rejects.toThrow('need user');
    });
    it('needs a path with an ID', async () => {
        req.path = '';
        await submitLane(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(400);
        expect(res.json.mock.calls[0][0]?.msg).toBe('No ID');
    });
    it('needs user permissions', async () => {
        dao.getLane.mockReturnValue({ permissions: null });
        await submitLane(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(403);
    });
    it('needs correct user', async () => {
        dao.getLane.mockReturnValue({ permissions: ['other@test.com'] });
        await submitLane(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(403);
    });
    it('takes admin in lieu user permissions', async () => {
        repo.getAdmins = () => (['test@bla.com']),
        dao.getLane.mockReturnValue({
            endpoint: {
                type: 'api',
                endpoint: 'https://bla',
                format: 'text',
            },
            version: 2,
            phase: 'q',
            permissions: null,
        });
        await submitLane(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(201);
    });
    it('needs correct version', async () => {
        req.body.version = 3;
        await submitLane(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(409);
        expect(res.json.mock.calls[0][0]?.msg).toMatch(/mismatch/i);
    });
    it('does not submit twice', async () => {
        dao.getLane.mockReturnValue({
            version: 2,
            sthAlreadyIn: 43, // must STAY & NOT be returned
            phase: 'p',
            permissions: ['test@bla.com'],
        });
        await submitLane(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(400);
    });

    it('fetches and formats a result', async () => {
        await submitLane(req, res, dao, repo);
        expect(dao.getLane.mock.calls.length).toBe(1);
        expect(dao.getLane.mock.calls[0][0]).toBe('lane123');
        expect(dao.saveLane.mock.calls.length).toBe(3);
        expect(dao.saveLane.mock.calls[2][0].phase).toBe('a');
        expect(dao.saveLane.mock.calls[2][0].question_answers).toBeDefined();
        expect(dao.saveLane.mock.calls[2][0].sthElse).not.toBeDefined();
        expect(dao.saveLane.mock.calls[2][0].sthAlreadyIn).toBe(43);
        expect(dao.saveLane.mock.calls[2][0].submittedAt).toBeDefined();
        expect(dao.saveLane.mock.calls[2][0].submittedBy).toBe('test@bla.com');
        expect(fetchMock.mock.calls.length).toBe(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://bla');
        expect(dao.saveLane.mock.calls[2][0].endpoint_answer).toBe('API-Res');
        expect(dao.saveLane.mock.calls[2][0].processed_answer).toBe('test-processed');
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(res.json.mock.calls[0][0]).toBeDefined();
        expect(res.json.mock.calls[0][0].ok).toBe(true);
        expect(res.json.mock.calls[0][0].lane?.question_answers).toBeDefined();
        expect(res.json.mock.calls[0][0].lane?.endpoint_answer).toBe('API-Res');
        expect(res.json.mock.calls[0][0].lane?.processed_answer).toBe('test-processed');
        expect(res.json.mock.calls[0][0].lane?.sthAlreadyIn).not.toBeDefined();
        expect(utils.workReservations.mock.calls.length).toBe(1);
    });
    it('performs reservations', async () => {
        utils.workReservations.mockReturnValue({reservations: [{resId: 'res1', resOptionId: 'opt2'}]});
        await submitLane(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(dao.logLimitedUse.mock.calls.length).toBe(1);
        expect(dao.logLimitedUse.mock.calls[0][0]).toBe('lane123');
        expect(dao.logLimitedUse.mock.calls[0][1]).toBe('res1');
        expect(dao.logLimitedUse.mock.calls[0][2]).toBe('opt2');
        expect(dao.logLimitedUse.mock.calls[0][3]).toBe(1);
    });
    it('responds to reservation errors', async () => {
        utils.workReservations.mockReturnValue({errors: ['test']});
        await submitLane(req, res, dao, repo);
        expect(res.status.mock.calls[0][0]).toBe(400);
        expect(res.json.mock.calls[0][0].ok).toBe(false);
        expect(res.json.mock.calls[0][0].msg).toMatch(/not complete reservation/);
    });
    it('fetches and formats a noop fake result', async () => {
        dao.getLane.mockReturnValue({
            endpoint: {
                type: 'noop',
            },
            version: 2,
            sthAlreadyIn: 43, // must STAY & NOT be returned
            phase: 'q',
            permissions: ['test@bla.com'],
        });
        await submitLane(req, res, dao, repo);
        expect(fetchMock.mock.calls.length).toBe(0);
        expect(dao.saveLane.mock.calls[2][0].endpoint_answer).not.toBeDefined();
        expect(dao.saveLane.mock.calls[2][0].processed_answer).toBe('test-processed');
        expect(res.status.mock.calls[0][0]).toBe(201);
        expect(res.json.mock.calls[0][0].lane?.processed_answer).toBe('test-processed');
    });

});
