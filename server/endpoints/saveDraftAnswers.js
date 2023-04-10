module.exports = async function(req, res, dao, repo) { // check correct user 4 sure (2nd step) & save only the answers; send version as well
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
        res.status(400).json({ok: false, msg: 'Need answers to be saved'});
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
        res.status(400).json({ok: false, msg: 'Can only save before submit'});
        return;
    }
    lane.question_answers = def.question_answers;
    await dao.saveLane(lane);
    res.status(201).json({ok: true, version: lane.version});
};