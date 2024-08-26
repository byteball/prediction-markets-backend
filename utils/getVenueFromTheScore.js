// 1 step: Check schedule from theScore API
// 2 step: Find the match (event) by home and away teams and date
// 3 step: Get the venue from the event details

const abbreviations = require('abbreviations');
const { default: axios } = require("axios");
const { getTheScoreCompetitionId } = require("./getTheScoreCompetitionId");
const l = require('js-levenshtein');

const { clearSoccerTeamName } = require('./clearSoccerTeamName');

exports.getVenueFromTheScore = async (feedName) => {
    const apiTheScoreUrl = process.env.apiTheScoreUrl;
    const [competition, _homeTeam, _awayTeam, date] = feedName.split('_');

    if (!apiTheScoreUrl) {
        console.error('log(venue): apiTheScoreUrl env aren\'t defined');
        return null;
    }

    const competitionId = getTheScoreCompetitionId(competition);

    if (!competitionId) {
        console.error('log(venue): theScore service doesn\'t support this competition', competition, feedName);
        return null;
    };

    const homeTeamObj = Object.values(abbreviations.soccer).find((item) => item.abbreviation === _homeTeam);
    const awayTeamObj = Object.values(abbreviations.soccer).find((item) => item.abbreviation === _awayTeam);

    if (!homeTeamObj || !awayTeamObj) {
        console.error('log(venue): home or away team not found', feedName);
        return null;
    }

    const schedule = await axios.get(`${apiTheScoreUrl}/${competitionId}/schedule`).then(({ data }) => data?.current_season).catch(() => []);

    const matchesByDate = schedule?.filter(({ id }) => id === date);

    const eventIds = matchesByDate.reduce((acc, { event_ids }) => {
        return [...acc, ...event_ids];
    }, []);

    if (eventIds.length === 0) {
        console.error('log(venue): events not found', feedName);
        return null;
    }

    const eventsGetter = eventIds.map((id) => axios.get(`${apiTheScoreUrl}/${competitionId}/events/${id}`));

    const clearedHomeTeam1 = clearSoccerTeamName(homeTeamObj.name);
    const clearedAwayTeam1 = clearSoccerTeamName(awayTeamObj.name);

    const events = await Promise.all(eventsGetter).then((res) => res.map(({ data }) => data));

    const currentEvent = events.find(({ home_team, away_team }) => {
        const clearedHomeTeam2 = clearSoccerTeamName(home_team.name);
        const clearedAwayTeam2 = clearSoccerTeamName(home_team.name);

        const homeMinLength = Math.min(clearedHomeTeam1.length, clearedHomeTeam2.length);
        const awayMinLength = Math.min(clearedAwayTeam1.length, clearedAwayTeam2.length);

        return home_team.abbreviation === _homeTeam && away_team.abbreviation === _awayTeam || l(clearedHomeTeam1, clearedHomeTeam2) >= (homeMinLength / 2) && l(clearedAwayTeam1, clearedAwayTeam2) >= (awayMinLength / 2)
    });

    if (!currentEvent || !currentEvent.event_details) {
        console.error('log(venue): event not found', feedName);
        return null
    }

    const stadium = currentEvent.event_details.find(({ identifier }) => identifier === 'stadium')?.content;
    const location = currentEvent.event_details.find(({ identifier }) => identifier === 'location')?.content;

    if (!stadium || !location) return null;

    return `${stadium}, ${location}`;
}
