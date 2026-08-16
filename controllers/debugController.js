const { ACCOUNTS, CALL_LOG } = require('../data/db');
const { PORT } = require('../config/env');

function getHealth(req, res) {
    res.json({
        status: 'ok',
        service: 'Kapture mock collections webhook',
        port: PORT,
    });
}

function getCallLog(req, res) {
    res.json({
        count: CALL_LOG.length,
        calls: CALL_LOG,
    });
}

function getAccounts(req, res) {
    const safeAccounts = {};
    for (const [accountId, account] of Object.entries(ACCOUNTS)) {
        const { valid_codes, ...safe } = account;
        safeAccounts[accountId] = safe;
    }
    res.json(safeAccounts);
}

module.exports = {
    getHealth,
    getCallLog,
    getAccounts
};
