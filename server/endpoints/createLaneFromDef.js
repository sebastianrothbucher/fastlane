module.exports = async function(req, res, dao, repo) { // POST, even though empty content; check user's permissions (or admin); forUsers=
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    if (!req.query.typeName) {
        res.status(400).json({ok: false, msg: 'No typeName given'});
        return;
    }
    if (!req.query.forUsers) {
        res.status(400).json({ok: false, msg: 'No forUsers given'});
        return;
    }
    const typeName = req.query.typeName;
    const def = repo.getLaneDefs()[typeName];
    const isAdmin = repo.getAdmins().includes(req.user);
    if ((!def) || (!((def.permissions || []).includes(req.user) || isAdmin))) {
        res.status(404).json({ok: false, msg: 'No such lane available'});
        return;
    }
    const forUsers = req.query.forUsers.split(',').map(s => s.trim());
    if (!(forUsers.includes(req.user) || isAdmin)) {
        res.status(403).json({ok: false, msg: 'Need to create for yourself'});
        return;
    }
    const newLane = {...def, title: (req.query.title || def.title), phase: 'q', permissions: forUsers, createdBy: req.user};
    const savedLane = await dao.createLane(newLane, typeName);
    res.status(201).json({ok: true, lane: savedLane});
};
