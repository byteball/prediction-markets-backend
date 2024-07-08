const conf = require('ocore/conf.js');
const { default: axios } = require("axios");
const moment = require('moment');
const abbreviations = require('abbreviations');
const { soccerCompetitions } = require('abbreviations/soccerCompetitions');
const { uniq, isEmpty } = require('lodash');

const marketDB = require('./db')

const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

class SportDataService {
  constructor() {
    this.calendar = {
      soccer: []
    };

    this.championships = {
      soccer: []
    };

    this.odds = { // by expected feed name
      soccer: {

      }
    }

    this.crests = {
      soccer: {

      }
    }

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

  getCrest(sport, championship, team_id) {
    if (sport in this.crests) {
      if (championship in this.crests[sport]) {
        if(`${team_id}` in this.crests[sport][championship]){
          return this.crests[sport][championship][`${team_id}`];
        }
      }
    }

    return null
  }

  async getOdds(sport, feed_name) {
    if (this.odds[sport]) {
      if (this.odds[sport][feed_name]) {
        return this.odds[sport][feed_name];
      } else {
        return await marketDB.api.getBookmakerOddsByFeedName(feed_name);
      }
    } else {
      return null;
    }
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
    if (competitionId === 2000) return 'WC';
    if (competitionId === 2001) return 'CL';
    if (competitionId === 2002) return 'BL1';
    if (competitionId === 2003) return 'DED';
    if (competitionId === 2013) return 'BSA';
    if (competitionId === 2014) return 'PD';
    if (competitionId === 2015) return 'FL1';

    if (competitionId === 2016) return 'ELC';
    if (competitionId === 2017) return 'PPL';

    if (competitionId === 2019) return 'SA';
    if (competitionId === 2021) return 'PL';

    if (competitionId === 2044) return 'CSL';
    if (competitionId === 2029) return 'BSB';
    if (competitionId === 2024) return 'ASL';
    if (competitionId === 2152) return 'CLI';
    return null;
  }

  async getSoccerCalendar() {
    let newData = [];
    const odds = {};

    const competitionsGetter = soccerCompetitions.map((id) => this.getSoccerMatchesByCompetition(id).then((data = {}) => {
      const { competition, matches } = data;

      const championship = this.getChampionshipBySoccerCompetitionId(id);

      matches.forEach(matchObject => {
        const feed_name = this.getFeedNameByMatches(championship, matchObject);

        if (!conf.sportOracleAddress) {
          console.error('no sport oracle', conf.sportOracleAddress);
        }

        const oddsObj = matchObject.odds;

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
            league: competition.name,
            venue: matchObject.venue
          });

          odds[feed_name] = {
            yes_odds: oddsObj ? oddsObj.homeWin : null,
            no_odds: oddsObj ? oddsObj.awayWin : null,
            draw_odds: oddsObj ? oddsObj.draw : null,
          }
        }
      });
    }));

    await Promise.all(competitionsGetter);

    return [newData, odds];
  }

  getChampionshipInfo(sport, championship) {
    if (this.championships[sport]) {
      const championshipInfo = this.championships[sport].find(({ code }) => code === championship);

      return championshipInfo || {}
    } else {
      return {};
    }
  }

  async getSoccerChampionshipsInfo() {
    return await this.footballApi.get('/v4/competitions').then(({ data }) => data.competitions).then(async (competitions) => {
      const crestsGetters = [];

      competitions.map(({ code, id }) => {
        crestsGetters.push(this.footballApi.get(`/v4/competitions/${id}/teams`).then(({ data }) => {
          if (!this.crests.soccer[code]) this.crests.soccer[code] = {};

          data?.teams.map(({ id, crest }) => {
            this.crests.soccer[code][id] = crest;
          })
        }));
      });

      await Promise.all(crestsGetters);

      return competitions;
    }).catch((error) => {
      console.error(error);
      return [];
    });
  }

  async updateSoccerCalendar() {
    try {
      const existingSportMarkets = await marketDB.api.getAllMarkets({ oracles: [conf.sportOracleAddress] });

      const feedNamesOfExistingSportMarkets = existingSportMarkets.map(({ feed_name }) => feed_name);

      const [soccerCalendar, odds] = await this.getSoccerCalendar();
      const existCompetitions = feedNamesOfExistingSportMarkets.map((feed_name) => feed_name.split("_")[0]);

      this.calendar.soccer = soccerCalendar.filter(({ feed_name }) => !feedNamesOfExistingSportMarkets.includes(feed_name)).sort((a, b) => a.event_date - b.event_date);
      this.calendar.soccer.forEach(({ feed_name }) => existCompetitions.push(feed_name.split("_")[0]));

      const soccerChampionships = uniq(existCompetitions);

      const championshipsInfo = await this.getSoccerChampionshipsInfo();

      this.calendar.soccer.forEach(({ yes_team_id, no_team_id, championship }, index) => {
        this.calendar.soccer[index].yes_crest_url = this.getCrest('soccer', championship, yes_team_id);
        this.calendar.soccer[index].no_crest_url = this.getCrest('soccer', championship, no_team_id); 
      });

      if (!isEmpty(championshipsInfo)) {
        this.championships.soccer = soccerChampionships.map((leagueName) => {
          const info = championshipsInfo.find(({ code }) => code === leagueName) || {};

          return ({
            code: leagueName,
            name: info.name || null,
            emblem: info.emblem || null
          })
        })
      }

      this.odds.soccer = odds;

      const now = moment.utc().unix();

      const marketsWaitingForOddsUpdate = existingSportMarkets.filter(({ event_date, feed_name }) => (event_date > now) && (feed_name in odds));

      const updatedOddsData = {};

      marketsWaitingForOddsUpdate.forEach(({ feed_name }) => {
        updatedOddsData[feed_name] = odds[feed_name];
      });

      marketDB.api.updateOdds(updatedOddsData);
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