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
      baseURL: `https://api.football-data.org`,
      headers: {
        ['X-Auth-Token']: conf.footballDataApiKey
      }
    });
  }

  getCalendar(sport, championship, page) {
    const limit = conf.limitMarketsOnPage;

    const offset = (page - 1) * limit;

    return (this.calendar[sport] || []).filter(({ championship: c }) => championship === 'all' || championship === c).slice(offset, offset + limit);
  }

  getCalendarLength(sport, championship) {
    if (this.calendar[sport]) {
      const sportCalendar = this.calendar[sport] || [];

      if (championship !== 'all') {
        return sportCalendar.filter(({ championship: c }) => c === championship).length
      } else {
        return sportCalendar.length;
      }

    }

    return 0
  }

  getChampionships(sport) {
    return sport ? (this.championships[sport] || []) : this.championships;
  }

  updater() {
    if (!this.intervalId) {
      this.intervalId = setInterval(this.updateSoccerCalendar.bind(this), UPDATE_INTERVAL);
    }
  }

  async getSoccerMatchesByCompetition(competitionId) {
    return await this.footballApi.get(`/v4/competitions/${competitionId}/matches?status=SCHEDULED`).then(({ data }) => data);
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
    if (competitionId === 2015) return 'FL1';
    if (competitionId === 2019) return 'SA';
    if (competitionId === 2021) return 'PL';
    return null;
  }

  async getSoccerCalendar() {
    let newData = [];

    const competitionList = [2001, 2002, 2003, 2013, 2014, 2015, 2019];
    const competitionsGetter = competitionList.map((id) => this.getSoccerMatchesByCompetition(id).then((data = {}) => {
      const { competition, matches } = data;

      const championship = this.getChampionshipBySoccerCompetitionId(id);

      matches.forEach(matchObject => {
        const feed_name = this.getFeedNameByMatches(championship, matchObject);

        if (feed_name) {
          newData.push({
            feed_name,
            event_date: moment.utc(matchObject.utcDate).unix(),
            expect_datafeed_value: abbreviations.soccer[matchObject.homeTeam.id].abbreviation,
            yes_team: matchObject.homeTeam.name,
            no_team: matchObject.awayTeam.name,
            yes_team_id: matchObject.homeTeam.id,
            no_team_id: matchObject.awayTeam.id,
            oracle: conf.sportOracleAddress,
            championship,
            league_emblem: competition.emblem,
            league: competition.name
          })
        }
      });
    }));

    await Promise.all(competitionsGetter);

    return newData;
  }

  getChampionshipInfo(sport, championship) {
    if (this.championships[sport]) {
      const championshipInfo = this.championships[sport].find(({ code }) => code === championship);

      return championshipInfo || {}
    } else {
      return null;
    }
  }

  async getSoccerChampionshipsInfo() {
    return await this.footballApi.get('/v4/competitions').then(({ data }) => data.competitions);
  }

  async updateSoccerCalendar() {
    try {
      const feedNamesOfExistingSportMarkets = await marketDB.api.getAllMarkets({ oracles: [conf.sportOracleAddress] }).then((markets) => markets.map(({ feed_name }) => feed_name));

      const soccerCalendar = await this.getSoccerCalendar();
      const existCompetitions = feedNamesOfExistingSportMarkets.map((feed_name) => feed_name.split("_")[0]);

      this.calendar.soccer = soccerCalendar.filter(({ feed_name }) => !feedNamesOfExistingSportMarkets.includes(feed_name)).sort((a, b) => a.event_date - b.event_date);
      this.calendar.soccer.forEach(({ feed_name }) => existCompetitions.push(feed_name.split("_")[0]));

      const soccerChampionships = uniq(existCompetitions);

      const championshipsInfo = await this.getSoccerChampionshipsInfo();

      this.championships.soccer = soccerChampionships.map((leagueName) => {
        const info = championshipsInfo.find(({ code }) => code === leagueName) || {};

        return ({
          code: leagueName,
          name: info.name || null,
          emblem: info.emblem || null
        })
      })
    } catch (err) {
      console.error('update sportData error', err);
    }
  }

  async init() {
    await this.updateSoccerCalendar();

    if (!this.intervalId) this.updater();
  }
}

exports.sportDataService = new SportDataService();