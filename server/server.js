// polyfill the fetch API below v17 (experimental) / v18 (stable)
if (process.version < 'v17') {
    require('isomorphic-fetch');
}

const express = require('express');
const expressSession = require('express-session');
const ExpressSessionMemoryStore = require('memorystore')(expressSession);
const crypto = require('crypto');
const morgan = require('morgan');
const passport = require('passport');
const PassportHeaderApiKey = require('passport-headerapikey').HeaderAPIKeyStrategy;
const PassportLocal = require('passport-local');

const dao = require('./dao/sqlite');
const repo = require('./repo/repo');

const getAvailableDefs = require('./endpoints/getAvailableDefs');
const createFreestyleLane = require('./endpoints/createFreestyleLane');
const createLaneFromDef = require('./endpoints/createLaneFromDef');
const getAllLanes = require('./endpoints/getAllLanes');
const getUserLanes = require('./endpoints/getUserLanes');
const getLaneData = require('./endpoints/getLaneData');
const getLimitedSlots = require('./endpoints/getLimitedSlots');
const saveDraftAnswers = require('./endpoints/saveDraftAnswers');
const submitLane = require('./endpoints/submitLane');

const app = express();

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* can bring fake back for demos NOW
app.use('/api/', (req, res, next) => {
    req.user = 'sebastianrothbucher@googlemail.com';
    next();
}); // to come (fake req.user until we have it)
*/
// make session optional for local only (not needed for apikey)
if (!process.env.SESSION_SECRET) {
    console.warn('Should secure the app by specifying a session secret!');
}
const sessionMiddleware = expressSession({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: true,
    saveUninitialized: false,
    store: new ExpressSessionMemoryStore({checkPeriod: 60 * 60 * 1000}), // (can also of course use redis, etc.)
});
app.use((req, res, next) => req.headers.authorization?.startsWith('Bearer ') ? next() : sessionMiddleware(req, res, next));
// passport with yaml as user & apikey repo
passport.use('apikey', new PassportHeaderApiKey(
    {header: 'Authorization', prefix: 'Bearer '},
    false,  // (passReqToCallback)
    async (apiKey, cb) => {
        for (let k of repo.getApiKeys()) {
            if (k.key === apiKey) {
                return cb(null, k.user); // (req.user is a string for us so far)
            }
        }
        return cb(null, false);
    },
));
passport.use('local', new PassportLocal(async (username, password, cb) => {
    for (let u of repo.getUsers()) {
        if (u.user === username) {
            const salt = u.passwordHash.substring(0, u.passwordHash.indexOf('$'));
            const hashed = salt + '$' + crypto.createHash('sha256').update(salt + '$' + password).digest('hex');
            if (hashed === u.passwordHash) {
                return cb(null, u.user);
            } else {
                return cb(null, false, {message: 'Incorrect password'});
            }
        }
        return cb(null, false);
    }
}));
// (now: integrate - agein different for apikey and local; could also use a plethora of other strategies like oauth)
passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((userid, cb) => cb(null, userid));
const apikeyAuthMiddleware = passport.authenticate('apikey', {session: false});
const localAuthOptions = {
    successReturnToOrRedirect: '/', // (or req.session.returnTo)
    failureRedirect: '/login.html',
};
const localAuthMiddleware = passport.authenticate(['session', 'local'], localAuthOptions);
app.use('/api/', (req, res, next) => req.headers.authorization?.startsWith('Bearer ') ? apikeyAuthMiddleware(req, res, next) : localAuthMiddleware(req, res, next));
app.post('/login.do', passport.authenticate('local', localAuthOptions));
app.post('/logout.do', localAuthMiddleware, (req, res, next) => req.logout((err) => err ? next(err) : res.redirect('/')));
// finally be sure to fail when we don't have a user (redir is not needed b/c we have an SPA that can catch the 401)
app.use('/api/', (req, res, next) => req.user ? next() : res.status(401).send());

dao.init();

// finally add our functions
app.get('/api/me', (req, res) => res.json({user: req.user}));
app.get('/api/defs', (req, res) => getAvailableDefs(req, res, dao, repo));
app.post('/api/createFreestyleLane', (req, res) => createFreestyleLane(req, res, dao, repo));
app.post('/api/createLaneFromDef', (req, res) => createLaneFromDef(req, res, dao, repo));
app.get('/api/lanes', (req, res) => getAllLanes(req, res, dao, repo));
app.get('/api/userlanes', (req, res) => getUserLanes(req, res, dao, repo));
app.get('/api/lane/:id', (req, res) => getLaneData(req, res, dao, repo));
app.get('/api/limited/:id', (req, res) => getLimitedSlots(req, res, dao, repo));
app.post('/api/save/:id', (req, res) => saveDraftAnswers(req, res, dao, repo));
app.post('/api/submit/:id', (req, res) => submitLane(req, res, dao, repo));
// (and statically serve the UI)
app.use(express.static('../client/', {fallthrough: false, index: ['index.html'], maxAge: 0}));

const port = process.env.PORT || 8080;
app.listen(port);
console.log('Listening on ' + port);
