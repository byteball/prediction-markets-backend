exports.getTheScoreCompetitionId = (competition) => {
    switch (competition) {
        case 'CL':
            return 'chlg';
        case 'BL1':
            return 'bund';
        case 'FL1':
            return 'fran';
        case 'WC':
            return 'worldcup';
        case 'ELC':
            return 'eng_fed';
        case 'SA':
            return 'seri';
        case 'EC':
            return 'uefa';
        default:
            return null;
    }
}
