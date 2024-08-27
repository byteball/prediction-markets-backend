const { default: axios } = require("axios");
const abbreviations = require('abbreviations');
const l = require('js-levenshtein');

const { getSportDataCompetitionId } = require("./getSportDataCompetitionId");
const { clearSoccerTeamName } = require("./clearSoccerTeamName");

// https://dashboard.api-football.com/soccer/requests

exports.getVenueFromSportData = async (feedName, timestamp) => {
    const [competition, _homeTeam, _awayTeam, date] = feedName.split('_');
    const season = date.split('-')[0];

    const apiSportsUrl = process.env.apiSportsUrl;
    const apiSportsApiKey = process.env.apiSportsApiKey;

    if (!apiSportsUrl || !apiSportsApiKey) {
        console.error('log(venue): apiSportsUrl or apiSportsApiKey env aren\'t defined');
        return null;
    }

    const headers = {
        'x-rapidapi-key': apiSportsApiKey,
        'x-rapidapi-host': apiSportsUrl.replace('https://', '')
    };

    const competitionId = getSportDataCompetitionId(competition);

    if (!competitionId) {
        console.error('log(venue): sport data service doesn\'t support this competition', feedName);
        return null;
    }

    const fixtures = await axios.get(`${apiSportsUrl}/fixtures?status=NS-TBD-LIVE-FT&league=${competitionId}&season=${season}`, { headers })
        .then(({ data }) => data.response || [])
        .catch(() => []);

    if (fixtures.length === 0) return null;

    const homeTeamObj = Object.values(abbreviations.soccer).find((item) => item.abbreviation === _homeTeam);
    const awayTeamObj = Object.values(abbreviations.soccer).find((item) => item.abbreviation === _awayTeam);

    if (!homeTeamObj || !awayTeamObj) return null;

    const filteredFixtures = fixtures.filter(({ fixture, teams }) => {
        const tsEqual = fixture.timestamp === timestamp;

        const homeTeam1 = clearSoccerTeamName(homeTeamObj.name);
        const awayTeam1 = clearSoccerTeamName(awayTeamObj.name);

        const homeTeam2 = clearSoccerTeamName(teams.home.name);
        const awayTeam2 = clearSoccerTeamName(teams.away.name);

        const homeMinLength = Math.min(homeTeam1.length, homeTeam2.length);
        const awayMinLength = Math.min(awayTeam1.length, awayTeam2.length);

        return tsEqual && l(homeTeam1, homeTeam2) >= (homeMinLength / 1.3) && l(awayTeam1, awayTeam2) >= (awayMinLength / 1.3);
    });

    if (!filteredFixtures.length) {
        console.error('log(venue): fixtures not found', feedName);
        return null;
    } else if (filteredFixtures.length > 1) {
        console.error(`warning(venue): ${filteredFixtures.length} were found`, feedName);
        return null;
    }

    const venueId = filteredFixtures[0]?.fixture?.venue?.id;
    if (!venueId) return null;

    const venueData = await axios.get(`${apiSportsUrl}/venues?id=${venueId}`, { headers })
        .then(({ data }) => data.response?.[0] || null)
        .catch(() => null);

    if (!venueData) {
        console.error('log(venue): venue not found', feedName);
        return null;
    }

    const { name, address, city, country } = venueData;

    if (!name || !country) {
        console.error('log(venue): venue data is not complete', feedName, venueData);
        return null;
    }

    return [name, address, city, country].filter((el) => el).join(', ');
};
