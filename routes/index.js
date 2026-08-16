const express = require('express');
const { handleWebhook } = require('../controllers/webhookController');
const { getHealth, getCallLog, getAccounts } = require('../controllers/debugController');

const router = express.Router();

router.post('/webhook', handleWebhook);
router.get('/', getHealth);
router.get('/debug/call-log', getCallLog);
router.get('/debug/accounts', getAccounts);

module.exports = router;
