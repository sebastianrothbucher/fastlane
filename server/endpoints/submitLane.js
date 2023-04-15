const utils = require('../utils/utils');

module.exports = async function(req, res, dao, repo) { // save answers, call endpoints, etc. & save raw result, transform (move from client), final save; check correct user for sure; file answer: URL.createObjectURL
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    const pathComp = (req.path || '').split('/').filter(s => !!s);
    if (!pathComp.length) {
        res.status(400).json({ok: false, msg: 'No ID'});
        return;
    }
    const id = pathComp[pathComp.length - 1];
    const lane = await dao.getLane(id);
    if (!lane) {
        res.status(404).json({ok: false, msg: 'Not found'});
        return;
    }
    const isAdmin = repo.getAdmins().includes(req.user);
    if (!(isAdmin || lane.permissions?.includes(req.user))) {
        res.status(403).json({ok: false, msg: 'Access denied'});
        return;
    }
    const def = req.body;
    if (!def?.question_answers) {
        res.status(400).json({ok: false, msg: 'Need answers to be submitted'});
        return;
    }
    if (!def?.version) {
        res.status(400).json({ok: false, msg: 'Need a version'});
        return;
    }
    if (def.version !== lane.version) {
        res.status(409).json({ok: false, msg: 'Version mismatch'});
        return;
    }
    if (lane.phase !== 'q') {
        res.status(400).json({ok: false, msg: 'Can only submit once'});
        return;
    }
    lane.question_answers = def.question_answers;
    const now = new Date().toISOString();
    lane.submittedAt = now,
    lane.submittedBy = req.user;
    // reserve limited slots - at least CHECK before and after & throw error
    const reserveRes = await utils.workReservations(lane, dao, repo);
    // now apply (or throw error)
    if (reserveRes.errors) {
        res.status(400).json({
            ok: false, 
            msg: 'Can not complete reservation: ' + reserveRes.errors.join(', '),
        });
        return;
    } else {
        await Promise.all(reserveRes.reservations.map(r => dao.logLimitedUse(lane.id, r.resId, r.resOptionId, 1)));
    }
    // TODO: can be extra smart and check limited again for negative - in case we over-reserved (& can also free again)
    lane.phase = 'p';
    await dao.saveLane(lane);
    // now do invoke backend & save again
    if ('noop' === lane.endpoint.type) {
        await new Promise(resolve => setTimeout(resolve, 2000));
    } else if ('api' === lane.endpoint.type) {
        let fullEndpoint = lane.endpoint.endpoint;
        const params = (lane.questions || []).map((q, i) => encodeURIComponent(q.id) + '=' + encodeURIComponent(lane.question_answers[i])).join('&');
        if (params.length > 0) {
            fullEndpoint += ((fullEndpoint.indexOf('?') >= 0 ? '&' : '?') + params);
        }
        fullEndpoint += ((fullEndpoint.indexOf('?') >= 0 ? '&' : '?') + '_user=' + encodeURIComponent(req.user));
        const resInit = await fetch(fullEndpoint); // TODO: body for post incl. _user, auth, error handling
        if ('json' === lane.endpoint.format) {
            const res = await resInit.json();
            lane.endpoint_answer = res;
        } else if ('file' === lane.endpoint.format) {
            const res = await resInit.blob();
            lane.endpoint_answer = URL.createObjectURL(res/*blob*/);
        } else {
            const res = await resInit.text();
            lane.endpoint_answer = res;
        }
    } // TODO: more invocation types
    // save plain answer and again the processed one (so far: care little about data consumption)
    await dao.saveLane(lane);
    lane.processed_answer = await utils.processAnswer(lane);
    lane.phase = 'a';
    await dao.saveLane(lane);
    // and return response
    res.status(201).json({ // no backend details
        ok: true,
        lane: {
            id: lane.id,
            version: lane.version,
            title: lane.title,
            description: lane.description,
            questions: lane.questions,
            question_answers: lane.question_answers,
            endpoint: {
                type: lane.endpoint?.type,
                format: lane.endpoint?.format,
            },
            processing: {
                type: lane.processing?.type,
            },
            endpoint_answer: lane.endpoint_answer,
            processed_answer: lane.processed_answer,
            createdAt: lane.createdAt,
            createdBy: lane.createdBy,
            updatedAt: lane.updatedAt,
            submittedAt: lane.submittedAt,
            submittedBy: lane.submittedBy,
        },
    });
};