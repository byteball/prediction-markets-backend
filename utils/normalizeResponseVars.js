// v1 agents report everything in separate response vars, v2 agents describe the operation in the `event` response var (JSON).
// Returns the response vars in the v1 shape for both versions, the input is not changed
exports.normalizeResponseVars = (responseVars) => {
    if (!responseVars || !responseVars.event) return responseVars || {};

    const { supplies, amount } = JSON.parse(responseVars.event);

    return {
        ...responseVars,
        ...(supplies && { supply_yes: supplies.yes, supply_no: supplies.no, supply_draw: supplies.draw }),
        ...(amount !== undefined && { claimed_amount: amount }), // claim_profit only
    };
}
