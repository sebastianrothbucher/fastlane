const showdown = require('showdown');

const utils = {
    async processAnswer(lane) {
        if ('file' === lane.endpoint.format) {
            return '<iframe class="fileres" src="' + lane.endpoint_answer + '"></iframe>';
        } else if ((!lane.processing?.type) || 'none' === lane.processing.type || 'default' === lane.processing.type) { // (that's simple)
            if ('markdown' === lane.endpoint.format) {
                const conv = new showdown.Converter();
                return conv.makeHtml(lane.endpoint_answer);
            } else if ('html' === lane.endpoint.format) {
                return lane.endpoint_answer;
            } else {
                return '<pre>' + lane.endpoint_answer + '</pre>'; // simple fallback
            }
        } else if ((lane.processing?.type) && 'template' === lane.processing.type && 'markdown' === lane.processing.templateFormat) {
            const qaMap = {};
            lane.questions.forEach((q, i) => qaMap[q.id] = lane.question_answers[i]);
            const unarray = (v) => (Array.isArray(v) ? v.join('\n') : v);
            const templateFilled = (unarray(lane.processing.template) || '').replace(/%([^%]+)%/g, (m, p1) => (qaMap[p1] || '-'));
            // TODO: same for answers from JSON-API (JS-path)
            const conv = new showdown.Converter();
            return conv.makeHtml(templateFilled);
        } // TODO: other processing/templating types
    },
    async workReservations(lane, dao, repo) {
        const errors = [];
        const reservations = [];
        await Promise.all(lane.questions.map(async (q, i) => {
            if (!q.limited) {
                return; // (just nfa)
            }
            const limitedDefs = repo.getLimitedRes()[q.limited];
            if (!limitedDefs) {
                errors.push('No slots for ' + q.limited);
                return;
            }
            const answer = lane.question_answers[i]; // = option ID
            const answerOption = limitedDefs.find(opt => opt.id === answer);
            if (!answerOption) {
                errors.push('No option ' + q.limited + '-' + answer);
                return;
            }
            const existingUsage = await dao.getLimitedUse(q.limited);
            const availableCount = ((answerOption.count || 0) - (existingUsage.find(u => u.id === answer)?.count || 0));
            if (availableCount < 1) {
                errors.push('No more free capacity ' + q.limited + '-' + answer);
                return;
            }
            // (now we can go ahead)
            reservations.push({
                resId: q.limited,
                resOptionId: answer,
            });
        }));
        if (errors.length > 0) {
            return {errors};
        } else {
            return {reservations};
        }
    },
};

module.exports = utils;