const mongoose = require('mongoose');

/**
 * Schema percorso
 * @param {number} id -id
 * @param {string} name - nome
 * @param {string} difficulty - difficoltà
 * @param {string} duration - durata
 *  */

const trekSchema = new mongoose.Schema({
  id: {type: Number, required: true, unique: true},
  name: {type: String, required: true}, 
  difficulty: {type: String, enum: ['Facile', 'Medio', 'Difficile']},
  duration: {type: String},
});

module.exports = mongoose.model('Trek', trekSchema);