const mutations = require('./mutations');

describe('mutations', () => {
    let state;

    beforeEach(() => {
        state = {
            lane: {
                phase: 'q',
                question_answers: [],
            },
        };
    });

    it('goes to next answer', () => {
        mutations.NEXT_ANSWER(state, {answer: 'hey'});
        expect(state.lane.question_answers.length).toBe(1);
        expect(state.lane.question_answers[0]).toBe('hey');
    });

    it('starts processing', () => {
        mutations.START_PROCESS(state);
        expect(state.lane.phase).toBe('p');
    });

    it('sets raw answer', () => {
        mutations.SET_RAW_ANSWER(state, {answer: 'hey'});
        expect(state.lane.endpoint_answer).toBe('hey');
    });

    it('sets processed answer and state', () => {
        mutations.SET_PROCESSED_ANSWER(state, {answer: 'hey'});
        expect(state.lane.processed_answer).toBe('hey');
        expect(state.lane.phase).toBe('a');
    });
});