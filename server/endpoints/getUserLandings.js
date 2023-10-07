module.exports = async function(req, res, dao, repo) {  // just name and a little info; no paging so far, just sort by last modified
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    const userLandings = await dao.getLandings(req.user);
    const userLandingsStatic = (repo.getLandings() || []).filter(l => l.permissions?.includes(req.user));
    const allLandingTemplates = repo.getLandingTemplates() || {};
    res.json({
        ok: true,
        landings: [...userLandings, ...userLandingsStatic].map(l => ({
            id: l.id, 
            version: l.version,
            template: l.template, 
            title: l.title || (l.template && allLandingTemplates[l.template]?.title) || undefined,
            briefing: l.briefing || (l.template && allLandingTemplates[l.template]?.briefing) || undefined,
            links: [...(l.links || []), ...((l.template && allLandingTemplates[l.template]?.links) || [])],
            createdAt: l.createdAt, 
            updatedAt: l.updatedAt, 
        })),
    });
};