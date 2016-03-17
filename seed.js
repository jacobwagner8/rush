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
]

module.exports = async(function*(db) {
  yield Promise.all(rushees.map(rushee => db.models.rushee.create(rushee)));
  yield Promise.all(actives.map(active => db.models.active.create(active)));
});