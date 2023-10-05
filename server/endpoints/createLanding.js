module.exports = async function(req, res, dao, repo) {  // just submit def or give template, admin only, needs forUsers=
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    const isAdmin = repo.getAdmins().includes(req.user);
    if (!isAdmin) {
        res.status(403).json({ok: false, msg: 'Forbidden'});
        return;
    }
    const def = req.body || {};
    const template = req.query.template;
    if (!(def?.template || def?.links || template)) {
        res.status(400).json({ok: false, msg: 'Incomplete definition'});
        return;
    }
    const forUsers = req.query.forUsers.split(',').map(s => s.trim());
    const newLanding = {...def, ...(template ? {template} : {}), permissions: forUsers, createdBy: req.user};
    const savedLanding = await dao.createLanding(newLanding);
    res.status(201).json({ok: true, landing: savedLanding});
};