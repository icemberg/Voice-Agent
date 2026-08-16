const { VAPI_SHARED_SECRET } = require('../config/env');
const { extractToolName, extractToolArguments } = require('../utils/vapiUtils');
const { runTool } = require('../services/toolService');
const { CALL_DISPOSITIONS } = require('../data/db');

function handleWebhook(req, res) {
    try {
        const body = req.body || {};
        const message = body.message;

        console.log('\n========================================');
        console.log('[VAPI WEBHOOK]');
        console.log('========================================');

        console.log('Message type:', message?.type);
        console.log('Call ID:', message?.call?.id || 'unknown');

        if (VAPI_SHARED_SECRET) {
            const authorization = req.headers.authorization || '';
            const xVapiSecret = req.headers['x-vapi-secret'] || '';
            const expectedBearer = `Bearer ${VAPI_SHARED_SECRET}`;
            const authenticated = authorization === expectedBearer || xVapiSecret === VAPI_SHARED_SECRET;

            if (!authenticated) {
                console.warn('[AUTH] Invalid Vapi webhook secret');
                return res.status(200).json({ results: [] });
            }
        }

        if (!message) {
            console.warn('[Webhook] No message object');
            return res.status(200).json({ status: 'acknowledged' });
        }

        if (message.type !== 'tool-calls') {
            console.log(`[Webhook] Non-tool event: ${message.type}`);
            if (message.type === 'end-of-call-report') {
                const callId = message?.call?.id;
                const disposition = callId ? CALL_DISPOSITIONS.get(callId) : undefined;

                if (!disposition) {
                    console.warn('[Safety net] Call ended with no disposition:', callId);
                } else {
                    console.log(`[Safety net] Final disposition: ${disposition}`);
                }
            }

            return res.status(200).json({ status: 'acknowledged' });
        }

        const calls = message.toolCallList || message.toolCalls || [];
        console.log(`[Tool calls received]: ${calls.length}`);
        console.log('[RAW TOOL CALL LIST]');
        console.log(JSON.stringify(calls, null, 2));

        const results = calls.map((call) => {
            const toolCallId = call?.id;
            const toolName = extractToolName(call);
            const toolArguments = extractToolArguments(call);
            const callId = message?.call?.id || null;

            console.log('\n----------------------------------------');
            console.log('[Processing tool call]');
            console.log('Tool call ID:', toolCallId);
            console.log('Tool name:', toolName);
            console.log('Tool arguments:', JSON.stringify(toolArguments));
            console.log('Call ID:', callId);
            console.log('----------------------------------------');

            if (!toolName) {
                console.error('[ERROR] Could not determine tool name.');
                return {
                    toolCallId,
                    result: JSON.stringify({
                        success: false,
                        message: 'Unable to determine the requested tool name from the Vapi payload.',
                    }),
                };
            }

            let result;
            try {
                result = runTool(toolName, toolArguments, callId);
            } catch (err) {
                console.error('[Tool execution error]', err);
                result = { success: false, message: `Internal error: ${err.message}` };
            }

            return { toolCallId, result: JSON.stringify(result) };
        });

        console.log('\n[VAPI TOOL RESPONSE]');
        console.log(JSON.stringify(results, null, 2));

        return res.status(200).json({ results });

    } catch (err) {
        console.error('[Webhook fatal error]', err);
        return res.status(200).json({ results: [] });
    }
}

module.exports = {
    handleWebhook
};
