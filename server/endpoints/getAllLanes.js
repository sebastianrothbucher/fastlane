module.exports = async function(req, res, dao, repo) {  // admin only, just name and a little info; will have to xpand soon with filter and paging; so far just sort by last modified
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    const isAdmin = repo.getAdmins().includes(req.user);
    if (!isAdmin) {
        res.status(403).json({ok: false, msg: 'Forbidden'});
        return;
    }
    const allLanes = await dao.getAllLanes();
    res.json({
        ok: true,
        lanes: allLanes.map(lane => ({
            id: lane.id, 
            version: lane.version,
            title: lane.title, 
            typeName: lane.typeName, 
            createdAt: lane.createdAt, 
            createdBy: lane.createdBy, 
            updatedAt: lane.updatedAt, 
            submittedAt: lane.submittedAt, 
            submittedBy: lane.submittedBy, 
            permissions: lane.permissions,
        })),
    });
};