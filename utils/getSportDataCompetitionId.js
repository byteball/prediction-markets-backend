exports.getSportDataCompetitionId = (competition) => {
    switch (competition) {
        case 'CL':
            return 2;
        case 'BL1':
            return 78;
        case 'FL1':
            return 61;
        case 'WC':
            return 1;
        case 'BSA':
            return 71;
        case 'PL':
            return 39;
        case 'PD':
            return 140;
        case 'PPL':
            return 94;
        case 'SA':
            return 135;
        case 'DED':
            return 88;
        case 'EC':
            return 4;
        default:
            return null;
    }
}
