const conf = require('ocore/conf.js');
const { default: axios } = require("axios");
const moment = require('moment');

const abbreviations = require('./abbreviations.json');

class FootballDataService {
  constructor() {
    this.calendar = {};
    this.api = axios.create({
      baseURL: `https://api.football-data.org/v2`,
      headers: {
        ['X-Auth-Token']: conf.footballDataApiKey
      }
    });
  }

  getCalendar() {
    return this.calendar;
  }

  async getMatchesByCompetition(competitionId) {
    return await this.api.get(`competitions/${competitionId}/matches`).then((({ data: { matches } }) => matches.filter(({ status }) => status === 'SCHEDULED')))
  }

  getFeedNameByMatches(championship, matchObj) {
    if (!abbreviations.soccer[matchObj.homeTeam.id] || !abbreviations.soccer[matchObj.awayTeam.id]) return null;

    const homeTeam = abbreviations.soccer[matchObj.homeTeam.id].abbreviation;
    const awayTeam = abbreviations.soccer[matchObj.awayTeam.id].abbreviation;

    return `${championship}_${homeTeam}_${awayTeam}_${moment.utc(matchObj.utcDate).format("YYYY-MM-DD")}`
  }

  getChampionshipByCompetitionId(competitionId) {
    if (competitionId === 2001) return 'CL';
    if (competitionId === 2002) return 'BL1';
    if (competitionId === 2003) return 'DED';
    if (competitionId === 2013) return 'BSA';
    if (competitionId === 2014) return 'PD';
    if (competitionId === 2015) return 'L1';
    if (competitionId === 2019) return 'SA';
    if (competitionId === 2021) return 'PL';

    return null;
  }

  async init() {
    let newData = {};

    try {
      const competitionList = [2001, 2002, 2003, 2013, 2014, 2015, 2019];

      const competitionsGetter = competitionList.map((id) => this.getMatchesByCompetition(id).then((data) => {
        const championship = this.getChampionshipByCompetitionId(id);

        if (!(championship in newData)) newData[championship] = [];

        data.forEach(matchObject => {
          const feed_name = this.getFeedNameByMatches(championship, matchObject);

          if (feed_name) {
            newData[championship].push({
              feed_name,
              event: `Will ${matchObject.homeTeam.name} win ${matchObject.awayTeam.name} ${moment.utc(matchObject.utcDate).format('ll')}?`,
              ts: moment.utc(matchObject.utcDate).unix(),
              expect_datafeed_value: abbreviations.soccer[matchObject.homeTeam.id].abbreviation
            })
          }
        });
      }));

      await Promise.all(competitionsGetter);

      this.calendar = newData;
    } catch (err) {
      console.error('data', err);
    }
  }
}

exports.footballDataService = new FootballDataService();