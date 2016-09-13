const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  title: { type: String, required: true },
  body:  { type: String }
}, {
  timestamps: true
});


module.exports = mongoose.model('User', userSchema);
