module.exports = async function(req, res, dao, repo) {  // excluding endpoints and stuff (positive list of what we will divulge, question and answer included)
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
    res.json({ // no backend details
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
            // TODO: user_data if isAdmin - i.e. data we can store and retrieve again in background
        },
    });
};