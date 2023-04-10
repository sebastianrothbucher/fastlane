module.exports = async function(req, res, dao, repo) {  // just name and a little info; no paging so far, just sort by last modified
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    const userLanes = await dao.getLanes(req.user);
    res.json({
        ok: true,
        lanes: userLanes.map(l => ({
            id: l.id, 
            title: l.title, 
            typeName: l.typeName, 
            createdAt: l.createdAt, 
            updatedAt: l.updatedAt, 
        })),
    });
};