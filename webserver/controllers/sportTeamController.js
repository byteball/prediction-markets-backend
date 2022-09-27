const abbreviations = require('abbreviations');

module.exports = async (request, reply) => {
  const abbreviation = request.params.abbreviation;
  const sport = request.params.sport;

  if (!(sport in abbreviations)) return reply.notFound();
  
  try {
    const team = Object.entries(abbreviations[sport]).find(([_, item]) => item.abbreviation === abbreviation)

    if (team) {
      return reply.send({ id: team[0], ...team[1] });
    } else {
      return reply.notFound();
    }


  } catch {
    return reply.internalServerError();
  }
}