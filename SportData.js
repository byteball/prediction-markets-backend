const conf = require('ocore/conf.js');
const { default: axios } = require("axios");
const moment = require('moment');
const marketDB = require('./db')
const abbreviations = require('./abbreviations.json');
const { uniq } = require('lodash');

const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

class SportDataService {
  constructor() {
    this.calendar = {
      soccer: []
    };

    this.championships = {
      soccer: []
    };

    this.footballApi = axios.create({
      baseURL: `https://api.football-data.org/v2`,
      headers: {
        ['X-Auth-Token']: conf.footballDataApiKey
      }
    });
  }

  getCalendar(sport, championship, page) {
    const limit = 10;

    const offset = (page - 1) * limit;

    return (this.calendar[sport] || []).filter(({ championship: c }) => championship === c).slice(offset, offset + limit);
  }

  getChampionships(sport) {
    return this.championships[sport] || [];
  }

  updater() {
    if (!this.intervalId) {
      this.intervalId = setInterval(this.updateSoccerCalendar.bind(this), UPDATE_INTERVAL);
    }
  }

  async getSoccerMatchesByCompetition(competitionId) {
    return await this.footballApi.get(`competitions/${competitionId}/matches?status=SCHEDULED`).then(({ data: { matches } }) => matches);
  }

  getFeedNameByMatches(championship, matchObj) {
    if (!abbreviations.soccer[matchObj.homeTeam.id] || !abbreviations.soccer[matchObj.awayTeam.id] || !matchObj.utcDate) return null;

    const homeTeam = abbreviations.soccer[matchObj.homeTeam.id].abbreviation;
    const awayTeam = abbreviations.soccer[matchObj.awayTeam.id].abbreviation;

    return `${championship}_${homeTeam}_${awayTeam}_${moment.utc(matchObj.utcDate).format("YYYY-MM-DD")}`
  }

  getChampionshipBySoccerCompetitionId(competitionId) {
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

  async getSoccerCalendar() {
    let newData = [];

    try {
      const competitionList = [2001, 2002, 2003, 2013, 2014, 2015, 2019];
      const competitionsGetter = competitionList.map((id) => this.getSoccerMatchesByCompetition(id).then((data) => {
        const championship = this.getChampionshipBySoccerCompetitionId(id);

        data.forEach(matchObject => {
          const feed_name = this.getFeedNameByMatches(championship, matchObject);

          if (feed_name) {
            newData.push({
              feed_name,
              event: `${matchObject.homeTeam.name} vs ${matchObject.awayTeam.name} for ${moment.utc(matchObject.utcDate).format('ll')}`,
              end_of_trading_period: moment.utc(matchObject.utcDate).unix(),
              expect_datafeed_value: abbreviations.soccer[matchObject.homeTeam.id].abbreviation,
              yes_team: matchObject.homeTeam.name,
              no_team: matchObject.awayTeam.name,
              yes_team_id: matchObject.homeTeam.id,
              no_team_id: matchObject.awayTeam.id,
              oracle: conf.sportOracleAddress,
              championship
            })
          }
        });
      }));

      await Promise.all(competitionsGetter);

      return newData;
    } catch (err) {
      console.error('Football data error: ', err);
    }
  }

  async updateSoccerCalendar() {
    const feedNamesOfExistingSportMarkets = await marketDB.api.getAllMarkets().then((markets) => markets.filter(({ oracle }) => oracle === conf.sportOracleAddress).map(({ feed_name }) => feed_name));
    const now = moment.utc().unix();
    const soccerCalendar = await this.getSoccerCalendar();
    const existCompetitions = feedNamesOfExistingSportMarkets.map((feed_name) => feed_name.split("_")[0]);

    this.calendar.soccer = soccerCalendar.filter(({ feed_name, end_of_trading_period }) => !feedNamesOfExistingSportMarkets.includes(feed_name) && ((end_of_trading_period - now) >= 24 * 3600)).slice(0, 15).sort((a, b) => a.end_of_trading_period - b.end_of_trading_period);
    this.calendar.soccer.forEach(({ feed_name }) => existCompetitions.push(feed_name.split("_")[0]));

    this.championships.soccer = uniq(existCompetitions);
  }

  async init() {
    await this.updateSoccerCalendar();

    if (!this.intervalId) this.updater();
  }
}

exports.sportDataService = new SportDataService();