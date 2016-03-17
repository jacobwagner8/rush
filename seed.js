const secrets = require('./secrets');

const rushees = [
  {
    dorm: "Donner",
    name: "John Doe",
    profile_picture: "http://lorempixel.com/image_output/animals-q-c-480-480-7.jpg",
    summary: "John fucking pulls!! Bid for sure. 5-5 chill to pull. Blah blah blah.",
    year: 'Fr'
  }
];

const actives = [
  {
    name: "Eddie Wang",
    pwd_hash: secrets.eddiew_pwd_hash
  }
];

const traits = [
  { name: "chill" },
  { name: "hype" },
]

const rushee_traits = [
  { rushee_id: 1, trait_name: "chill", votes: 1 }
];

const rushee_trait_votes = [
  { rushee_id: 1, active_id: 1, trait_name: "chill" }
];

module.exports = async(function*(db) {
  yield Promise.all(rushees.map(rushee => db.models.rushee.create(rushee)));
  yield Promise.all(actives.map(active => db.models.active.create(active)));
  yield Promise.all(traits.map(trait => db.models.trait.create(trait)));
  yield Promise.all(rushee_traits.map(rushee_trait => db.models.rushee_trait.create(rushee_trait)));
  yield Promise.all(rushee_trait_votes.map(rushee_trait_vote => db.models.rushee_trait_vote.create(rushee_trait_vote)));
});