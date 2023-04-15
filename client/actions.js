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
        /*if ('noop' === context.state.lane.endpoint.type) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            context.dispatch('processAnswer');
        } else if ('api' === context.state.lane.endpoint.type) {
            const res = await fetch(context.state.lane.endpoint.endpoint) // TODO: params / body / auth; error handling
                .then(res => res['json' === context.state.lane.endpoint.format ? 'json' : 'file' === context.state.lane.endpoint.format ? 'blob' : 'text']());
            context.commit('SET_RAW_ANSWER', {answer: res});
            context.dispatch('processAnswer');
        } // TODO: more invocation types*/
    },
    /*processAnswer(context) {
        if ('file' === context.state.lane.endpoint.format) {
            context.commit('SET_PROCESSED_ANSWER', {answer: '<iframe class="fileres" src="' + URL.createObjectURL(context.state.lane.endpoint_answer) + '"></iframe>'});
        } else if ((!context.state.lane.processing.type) || 'none' === context.state.lane.processing.type || 'default' === context.state.lane.processing.type) { // (that's simple)
            if ('markdown' === context.state.lane.endpoint.format) {
                const conv = new showdown.Converter();
                context.commit('SET_PROCESSED_ANSWER', {answer: conv.makeHtml(context.state.lane.endpoint_answer)});
            } else if ('html' === context.state.lane.endpoint.format) {
                context.commit('SET_PROCESSED_ANSWER', {answer: context.state.lane.endpoint_answer});
            } else {
                context.commit('SET_PROCESSED_ANSWER', {answer: ('<pre>' + context.state.lane.endpoint_answer + '</pre>')}); // simple fallback
            }
        } else if ('template' === context.state.lane.processing.type && 'markdown' === context.state.lane.processing.templateFormat) {
            const qaMap = {};
            context.state.lane.questions.forEach((q, i) => qaMap[q.var] = context.state.lane.question_answers[i]);
            const unarray = (v) => (Array.isArray(v) ? v.join('\n') : v);
            const templateFilled = (unarray(context.state.lane.processing.template) || '').replace(/%([^%]+)%/g, (m, p1) => (qaMap[p1] || '-'));
            // TODO: same for answers from JSON-API
            const conv = new showdown.Converter();
            context.commit('SET_PROCESSED_ANSWER', {answer: conv.makeHtml(templateFilled)});
        } // TODO: other processing/templating types
    },*/
};

if (typeof(module) !== 'undefined') { // easy testing
    module.exports = actions;
}
