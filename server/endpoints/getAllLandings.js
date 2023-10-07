module.exports = async function(req, res, dao, repo) {  // admin only, just name and a little info; will have to xpand soon with filter and paging; so far just sort by last modified
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    const isAdmin = repo.getAdmins().includes(req.user);
    if (!isAdmin) {
        res.status(403).json({ok: false, msg: 'Forbidden'});
        return;
    }
    const allLandings = await dao.getAllLandings();
    const allLandingsStatic = repo.getLandings() || [];
    const allLandingTemplates = repo.getLandingTemplates() || {};
    res.json({
        ok: true,
        landings: [...allLandings, ...allLandingsStatic].map(landing => ({
            id: landing.id, 
            version: landing.version,
            template: landing.template, 
            title: landing.title || (landing.template && allLandingTemplates[landing.template]?.title) || undefined,
            briefing: landing.briefing || (landing.template && allLandingTemplates[landing.template]?.briefing) || undefined,
            links: [...(landing.links || []), ...((landing.template && allLandingTemplates[landing.template]?.links) || [])],
            createdAt: landing.createdAt, 
            createdBy: landing.createdBy, 
            updatedAt: landing.updatedAt, 
            permissions: landing.permissions,
        })),
    });
};