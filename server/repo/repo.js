const fs = require('fs');
const yaml = require('yaml');

let lastRead = 0;
const REREAD = 30000; // ms

let _laneDefs = {};
let _landings = {};
let _landingTemplates = {};
let _limitedRes = {};
let _users = [];
let _admins = [];
let _apiKeys = [];
let _baseUrl = null;

function readIfNeeded() {
    const now = Date.now();
    if ((now - REREAD) > lastRead) {
        console.log('(re)reading repo yaml');
        const cnt = yaml.parse(fs.readFileSync('../fastlane.yml', 'utf-8'));
        _laneDefs = cnt['lanes'];
        _landings = cnt['landings'];
        _landingTemplates = cnt['landing-templates'];
        _limitedRes = cnt['limited-resources'];
        _users = cnt['users'];
        _admins = cnt['admins'];
        _apiKeys = cnt['apiKeys'];
        _baseUrl = cnt['baseUrl'];
    } // else we're still good
}

const repo = { // read yml and get lane defs
    getLaneDefs() {
        readIfNeeded();
        return _laneDefs;
    },
    getLandings() {
        readIfNeeded();
        return _landings;
    },
    getLandingTemplates() {
        readIfNeeded();
        return _landingTemplates;
    },
    getLimitedRes() {
        readIfNeeded();
        return _limitedRes;
    },
    getUsers() {
        readIfNeeded();
        return _users;
    },
    getAdmins() {
        readIfNeeded();
        return _admins;
    },
    getApiKeys() {
        readIfNeeded();
        return _apiKeys;
    },
    getBaseUrl() {
        readIfNeeded();
        return _baseUrl;
    },
};

module.exports = repo;
