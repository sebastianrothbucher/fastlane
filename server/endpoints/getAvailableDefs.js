module.exports = async function(req, res, dao, repo) {
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    res.json({
        ok: true,
        lanes: Object.entries(repo.getLaneDefs())
            .filter(lde => (lde[1].permissions || []).includes(req.user))
            .map(lde => ({typeName: lde[0], title: lde[1].title, description: lde[1].description})),
    });
};