const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FileSchema = new Schema({
    building: String,
    result: [{}],
    create: Date,
    block: String
});

module.exports = FileSchema;