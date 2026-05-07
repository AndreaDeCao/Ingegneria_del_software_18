const mongoose = require('mongoose');

//Struttura percorso nel DB
const trekSchema = new mongoose.Schema({
  name: {type: String, required: true},
  difficulty: {type: String, enum: ['Facile', 'Medio',' Difficile']},
  duration: {type: String},
});

module.exports = mongoose.model('Trek', trekSchema);