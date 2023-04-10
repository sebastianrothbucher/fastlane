module.exports = async function(req, res, dao, repo) {
    if (!req.user) {
        throw new Error('need user'); // be really sure
    }
    const pathComp = (req.path || '').split('/').filter(s => !!s);
    if (!pathComp.length) {
        res.status(400).json({ok: false, msg: 'No ID'});
        return;
    }
    const id = pathComp[pathComp.length - 1];
    const limitedDefs = repo.getLimitedRes()[id];
    if (!limitedDefs) {
        res.status(404).json({ok: false, msg: 'Not found'});
        return;
    }
    const existingUsage = await dao.getLimitedUse(id);
    const options = limitedDefs.map(opt => ({
        ...opt,
        count: ((opt.count || 0) - (existingUsage.find(u => u.id === opt.id)?.count || 0)),
    })).filter(opt => opt.count > 0);
    options.forEach(opt => delete opt.count); // don't be transparent to the outside
    res.json({
        ok: true,
        options: options,
    });
};