const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FileSchema = new Schema({
    building: String,
    result: [{}],
    create: Date
});

const File = mongoose.model('file', FileSchema);

module.exports = File;