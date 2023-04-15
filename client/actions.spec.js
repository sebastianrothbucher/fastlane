const actions = require('./actions');
const _showdown = require('showdown');

describe('actions', () => { 
    let context;
    let oldFetch, oldShowdown;

    beforeAll(() => {
        oldFetch = global.fetch;
        global.fetch = jest.fn();
        oldShowdown = global.showdown;
        global.showdown = _showdown; // (actually use it)
    });
    afterAll(() => {
        global.fetch = oldFetch;
        global.showdown = oldShowdown;
    });

    beforeEach(() => {
        global.fetch.mockClear();
        context = {
            state: {
                lane: {
                    id: '12345',
                    phase: 'q',
                    questions: [
                        {id: 'q1'},
                        {id: 'q2'},
                    ],
                    question_answers: [],
                    endpoint: {
                        type: 'api',
                        endpoint: 'schmu://whatever',
                        format: 'text',
                    },
                    processing: {
                        type: 'default',
                    },
                    endpoint_answer: null,
                    processed_answer: null,
                },
            },
            commit: jest.fn(),
            dispatch: jest.fn(),
        };
    });

    it('logs an answer and proceeds to preflight after last answer', () => {
        context.commit.mockImplementation((what, payload) => context.state.lane.question_answers.push(payload.answer));
        actions.nextAnswer(context, {answer: 'hey1'});
        expect(context.commit.mock.calls.length).toBe(1);
        expect(context.commit.mock.calls[0][0]).toBe('NEXT_ANSWER');
        expect(context.commit.mock.calls[0][1]?.answer).toBe('hey1');
        expect(context.state.lane.phase).toBe('q');
        actions.nextAnswer(context, {answer: 'hey2'});
        expect(context.commit.mock.calls.length).toBe(2);
        expect(context.commit.mock.calls[1][0]).toBe('NEXT_ANSWER');
        expect(context.commit.mock.calls[1][1]?.answer).toBe('hey2');
        expect(context.state.lane.phase).toBe('pf');
    });

    it('fetches from backend', async () => {
        global.fetch.mockReturnValue(Promise.resolve({
            json: () => Promise.resolve({lane: {
                endpoint_answer: 'some ep answer',
                processed_answer: 'some processed answer',
            }}),
        }));
        await actions.startProcess(context);
        expect(context.commit.mock.calls[0][0]).toBe('START_PROCESS');
        expect(global.fetch.mock.calls.length).toBe(1);
        expect(global.fetch.mock.calls[0][0]).toBe('/api/submit/12345');
        expect(global.fetch.mock.calls[0][1]?.body).toBeDefined();
        expect(context.commit.mock.calls[1][0]).toBe('SET_RAW_ANSWER');
        expect(context.commit.mock.calls[1][1]?.answer).toBe('some ep answer');
        expect(context.commit.mock.calls[2][0]).toBe('SET_PROCESSED_ANSWER');
        expect(context.commit.mock.calls[2][1]?.answer).toBe('some processed answer');
    });

    /*it('fetches from API as text', async () => {
        context.state.lane.endpoint.format = 'text';
        global.fetch.mockReturnValue(Promise.resolve({
            text: () => Promise.resolve('hey')
        }));
        await actions.startProcess(context);
        expect(context.commit.mock.calls[0][0]).toBe('START_PROCESS');
        expect(global.fetch.mock.calls.length).toBe(1);
        expect(global.fetch.mock.calls[0][0]).toBe('schmu://whatever');
        expect(context.commit.mock.calls[1][0]).toBe('SET_RAW_ANSWER');
        expect(context.commit.mock.calls[1][1]?.answer).toBe('hey');
        expect(context.dispatch.mock.calls.length).toBe(1);
        expect(context.dispatch.mock.calls[0][0]).toBe('processAnswer');
    });
    it('fetches from API as json', async () => {
        context.state.lane.endpoint.format = 'json';
        global.fetch.mockReturnValue(Promise.resolve({
            json: () => Promise.resolve({t: 'hey'})
        }));
        await actions.startProcess(context);
        expect(global.fetch.mock.calls.length).toBe(1);
        expect(global.fetch.mock.calls[0][0]).toBe('schmu://whatever');
        expect(context.commit.mock.calls[1][0]).toBe('SET_RAW_ANSWER');
        expect(context.commit.mock.calls[1][1]?.answer?.t).toBe('hey');
        expect(context.dispatch.mock.calls.length).toBe(1);
        expect(context.dispatch.mock.calls[0][0]).toBe('processAnswer');
    });

    it('formats HTML verbatim', () => {
        context.state.lane.endpoint.format = 'html';
        context.state.lane.endpoint_answer = '<h2>bla';
        actions.processAnswer(context);
        expect(context.commit.mock.calls[0][0]).toBe('SET_PROCESSED_ANSWER');
        expect(context.commit.mock.calls[0][1]?.answer).toBe('<h2>bla');
    });
    it('passes text preformatted', () => {
        context.state.lane.endpoint.format = 'text';
        context.state.lane.endpoint_answer = 'bla';
        actions.processAnswer(context);
        expect(context.commit.mock.calls[0][0]).toBe('SET_PROCESSED_ANSWER');
        expect(context.commit.mock.calls[0][1]?.answer).toBe('<pre>bla</pre>');
    });
    it('passes unknown preformatted', () => {
        context.state.lane.endpoint.format = 'whatever';
        context.state.lane.endpoint_answer = 'bla';
        actions.processAnswer(context);
        expect(context.commit.mock.calls[0][0]).toBe('SET_PROCESSED_ANSWER');
        expect(context.commit.mock.calls[0][1]?.answer).toBe('<pre>bla</pre>');
    });
    it('passes markdown as transformed', () => {
        context.state.lane.endpoint.format = 'markdown';
        context.state.lane.endpoint_answer = '##bla';
        actions.processAnswer(context);
        expect(context.commit.mock.calls[0][0]).toBe('SET_PROCESSED_ANSWER');
        expect(context.commit.mock.calls[0][1]?.answer).toMatch(/<h2.*>bla<\/h2>/);
    });*/

});