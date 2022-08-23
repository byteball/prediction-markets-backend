const { default: axios } = require('axios');
const fs = require('fs').promises;
const existsSync = require('fs').existsSync;
const mkdirSync = require('fs').mkdirSync;
const sharp = require('sharp');

const abbreviations = require('../abbreviations.json');

async function saveImage(data, id, type) {
    return await fs.writeFile(`static/${id}.${type}`, data)
}

async function getSoccerEmblems() {

    if (!existsSync('static/')) {
        mkdirSync('static/');
    }

    const emblemsGetters = [];

    Object.keys(abbreviations.soccer).map((id) => {
        emblemsGetters.push(axios.get(`https://crests.football-data.org/${id}.svg`).then(({ data }) => saveImage(data, id, 'svg')).catch(() => {
            axios.get(`https://crests.football-data.org/${id}.png`, { responseType: 'arraybuffer' }).then(({ data }) => {
                sharp(data).png().toFile(`static/${id}.png`)
            }).catch((err) => console.error('catch getSoccerEmblems', err))
        }));
    });

    await Promise.all(emblemsGetters);
}

getSoccerEmblems();