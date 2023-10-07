const actions = { // (using mutations at some points - though little shame in doing primitive settings outright)
    nextAnswer(context, {answer, i}) {
        context.commit('NEXT_ANSWER', {answer, i});
        if ((typeof(i) !== 'number' && context.state.lane.question_answers.length >= context.state.lane.questions.length)
                || (typeof(i) === 'number' && i === (context.state.lane.questions.length - 1))) {
            context.state.lane.phase = 'pf'; // yet really invoke preflight, if we have one
        }
    },
    async startProcess(context) {
        context.commit('START_PROCESS');
        const backendRes = await fetch('/api/submit/' + context.state.lane.id, {method: 'POST', body: JSON.stringify(context.state.lane), headers: {'Content-type': 'application/json'}}).then(res => res.json());
        context.commit('SET_RAW_ANSWER', {answer: backendRes.lane.endpoint_answer});
        context.commit('SET_PROCESSED_ANSWER', {answer: backendRes.lane.processed_answer});
    },
};

if (typeof(module) !== 'undefined') { // easy testing
    module.exports = actions;
}
