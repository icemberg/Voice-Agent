const { ACCOUNTS, CALL_LOG, CALL_DISPOSITIONS } = require('../data/db');

const toolHandlers = {
    identify_caller: (args) => {
        const digits = String(args.contact_value || '').replace(/\D/g, '');
        const match = Object.entries(ACCOUNTS).find(([id, acc]) =>
            id.toLowerCase() === String(args.contact_value).toLowerCase() ||
            (digits.length >= 6 && acc.phone_number?.replace(/\D/g, '').endsWith(digits))
        );
        if (!match) return { found: false, message: 'No account found for that number/ID.' };
        const [account_id, acc] = match;
        return { found: true, account_id, customer_name: acc.customer_name };
    },

    get_account_details: (args) => {
        const account = ACCOUNTS[args.account_id];
        if (!account) return { success: false, message: 'Unknown account_id' };
        const { valid_codes, ...safeAccount } = account;
        return { success: true, ...safeAccount };
    },

    verify_customer: (args) => {
        const account = ACCOUNTS[args.account_id];
        if (!account) {
            console.warn('[verify_customer] Unknown account:', args.account_id);
            return { verified: false, message: 'Unknown account_id' };
        }
        if (args.verification_code === undefined || args.verification_code === null) {
            return { verified: false, message: 'Verification code was not provided.' };
        }
        const suppliedCode = String(args.verification_code).trim();
        const ok = account.valid_codes.includes(suppliedCode);
        console.log(`[verify_customer] account=${args.account_id}, verified=${ok}`);
        if (ok) return { verified: true, message: 'Identity verified successfully.' };
        return { verified: false, message: 'Verification failed. Incorrect code.' };
    },

    log_promise_to_pay: (args) => {
        const account = ACCOUNTS[args.account_id];
        if (!account) return { success: false, message: 'Unknown account_id' };
        if (!args.ptp_date) return { success: false, message: 'Payment commitment date is required.' };
        if (args.amount === undefined || args.amount === null || args.amount === '') {
            return { success: false, message: 'Payment commitment amount is required.' };
        }
        const ptpId = `PTP-${Math.floor(1000 + Math.random() * 9000)}`;
        return { success: true, ptp_id: ptpId, confirmed_date: args.ptp_date, amount: args.amount };
    },

    send_payment_link: (args) => {
        const account = ACCOUNTS[args.account_id];
        if (!account) return { success: false, message: 'Unknown account_id' };
        const channel = args.channel || 'registered mobile number';
        return { success: true, message: `Payment link sent via ${channel} to the registered number.` };
    },

    escalate_to_agent: (args) => {
        const account = ACCOUNTS[args.account_id];
        if (!account) return { success: false, message: 'Unknown account_id' };
        const ticketId = `ESC-${Math.floor(1000 + Math.random() * 9000)}`;
        return { success: true, ticket_id: ticketId, reason: args.reason || 'GENERAL' };
    },

    mark_disposition: (args, callId) => {
        const account = ACCOUNTS[args.account_id];
        if (!account) return { success: false, message: 'Unknown account_id' };
        
        const status = args.status || 'UNKNOWN';
        if (callId && CALL_DISPOSITIONS.has(callId)) {
            console.warn(`[Disposition] Duplicate disposition prevented for call ${callId}`);
            return { success: true, disposition_logged: CALL_DISPOSITIONS.get(callId), duplicate: true };
        }
        
        const disposition = {
            call_id: callId,
            account_id: args.account_id,
            status,
            notes: args.notes || '',
            timestamp: new Date().toISOString(),
        };
        CALL_LOG.push(disposition);
        if (callId) {
            CALL_DISPOSITIONS.set(callId, status);
        }
        console.log('[Disposition logged]', disposition);
        return { success: true, disposition_logged: status };
    }
};

function runTool(name, args = {}, callId = null) {
    console.log('----------------------------------------');
    console.log('[runTool]');
    console.log('Tool:', name);
    console.log('Arguments:', JSON.stringify(args));
    console.log('Call ID:', callId);
    console.log('----------------------------------------');

    if (!name) {
        return { success: false, message: 'Tool name was not provided by Vapi.' };
    }

    const handler = toolHandlers[name];
    if (handler) {
        return handler(args, callId);
    }

    console.warn('[Unknown tool]', name);
    return { success: false, message: `Unknown tool: ${name}` };
}

module.exports = {
    runTool,
    toolHandlers
};
