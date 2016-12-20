const mongoose = require('mongoose');
const Schema   = mongoose.Schema;


const artSchema = new Schema({
    title: { type: String },
    description:  { type: String },

    canvas_file: { type: String },
    art_file: { type: String },

    entity_project: { type: String },

    lat: { type: Number },
    lng: { type: Number }
});


module.exports = mongoose.model('Art', artSchema);
