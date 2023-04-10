module.exports = async function(req, res, dao, repo) {  // just submit def, admin only, needs forUsers=
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    const isAdmin = repo.getAdmins().includes(req.user);
    if (!isAdmin) {
        res.status(403).json({ok: false, msg: 'Forbidden'});
        return;
    }
    const def = req.body;
    if (!(def?.questions && def?.endpoint)) {
        res.status(400).json({ok: false, msg: 'Incomplete definition'});
        return;
    }
    const forUsers = req.query.forUsers.split(',').map(s => s.trim());
    const newLane = {...def, title: (req.query.title || def.title), phase: 'q', permissions: forUsers, createdBy: req.user};
    const savedLane = await dao.createLane(newLane);
    res.status(201).json({ok: true, lane: savedLane});
};