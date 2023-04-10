const mutations = {
    NEXT_ANSWER(state, {answer, i}) {
        if (typeof(i) === 'number') {
            while ((state.lane.question_answers.length - 1) < i) {
                state.lane.question_answers.push(null);
            }
            state.lane.question_answers[i] = answer;
        } else {
            state.lane.question_answers.push(answer);
        }
    },
    START_PROCESS(state) {
        state.lane.phase = 'p';
    },
    SET_RAW_ANSWER(state, {answer}) {
        state.lane.endpoint_answer = answer;
    },
    SET_PROCESSED_ANSWER(state, {answer}) {
        state.lane.phase = 'a';
        state.lane.processed_answer = answer;
    },
};

if (typeof(module) !== 'undefined') { // easy testing
    module.exports = mutations;
}
