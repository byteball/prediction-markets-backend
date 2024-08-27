exports.clearSoccerTeamName = (teamName) => {
    let transformedTeamName = teamName;

    const h = [" FC", "FC ", " CF", " CFC", "UD ", "SD ", " AC", "SCO ", "AS ", "RC ", "GD ", "UC ", "RB ", "FK ", "NK ", "CD ", " FF", "SE ", "SA ", " FR", " EC", "AA ", "CA ", "CK ", " CS", "RB ", "CDC ", " CDP", "LDU ", "FCI ", "JK", "AIK ", "US ", " TC"];

    for (let i = 0; i < h.length; i++) {
        transformedTeamName = transformedTeamName.replace(h[i], "");
    }

    return transformedTeamName.toLowerCase();
};
