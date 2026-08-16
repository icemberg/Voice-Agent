function normalizeArguments(args) {
    if (args === undefined || args === null) {
        return {};
    }
    if (typeof args === 'object') {
        return args;
    }
    if (typeof args === 'string') {
        try {
            return JSON.parse(args);
        } catch (err) {
            console.error('[Argument parse error]', args);
            return {};
        }
    }
    return {};
}

function extractToolName(call) {
    if (!call || typeof call !== 'object') {
        return undefined;
    }
    return (
        call.name ||
        call.function?.name ||
        call.tool?.name ||
        call.functionCall?.name ||
        call.toolCall?.name ||
        call.toolCall?.function?.name ||
        undefined
    );
}

function extractToolArguments(call) {
    if (!call || typeof call !== 'object') {
        return {};
    }
    const args =
        call.arguments ??
        call.function?.arguments ??
        call.tool?.arguments ??
        call.functionCall?.arguments ??
        call.toolCall?.arguments ??
        call.toolCall?.function?.arguments ??
        {};
    return normalizeArguments(args);
}

module.exports = {
    normalizeArguments,
    extractToolName,
    extractToolArguments
};
