const secrets = require('./secrets');

const events = [{},{},{},{}];

const rushees = [
  {
    dorm: "Donner",
    name: "John Doe",
    profile_picture: "http://placehold.it/450x450",
    summary: "John fucking pulls!! Bid for sure. 5-5 chill to pull. Blah blah blah.",
    year: 'Fr'
  },
  {
    dorm: "Serra",
    name: "David Johnson",
    profile_picture: "http://placehold.it/450x450",
    summary: '',
    year: 'Fr'
  }
];

const actives = [
  {
    name: "Eddie Wang",
    pwd: 'test pwd'
  },
  {
    name: "Noah Golub",
    pwd: 'test pwd2'
  },
  {
    name: "Tyler Smith",
    pwd: 'test pwd'
  },
  {
    name: "Abraham Apellanes",
    pwd: 'test pwd'
  }
];

const ratings = [
  { rushee_id: 1, active_id: 1, value: 5 }
];

const traits = [
  { name: "chill" },
  { name: "hype" },
  { name: "cs" },
];

const rushee_trait_votes = [
  { rushee_id: 1, active_id: 1, trait_name: "chill" },
  { rushee_id: 2, active_id: 2, trait_name: "cs" }
];

const rushee_comments = [
  { rushee_id: 1, active_id: 1, text: 'anyone know why this guy is a cat?' },
  { rushee_id: 1, active_id: 1, text: 'meh i guess its chill' },
  { rushee_id: 1, active_id: 1, text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.' }
];

module.exports = async(function*(db) {
  yield Promise.all(rushees.map(rushee => db.models.rushee.create(rushee)));
  yield Promise.all(actives.map(active => db.models.active.create(active)));
  yield Promise.all(events.map(event => db.models.event.create(event)));
  yield Promise.all(ratings.map(rating => db.models.rating.create(rating)));
  yield Promise.all(traits.map(trait => db.models.trait.create(trait)));
  yield Promise.all(rushee_trait_votes.map(rushee_trait_vote => db.models.rushee_trait_vote.create(rushee_trait_vote)));
  yield Promise.all(rushee_comments.map(rushee_comment => db.models.rushee_comment.create(rushee_comment)));
});
