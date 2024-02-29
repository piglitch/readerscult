const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const genreSchema = new Schema({
  name: { type: String, ref: "Book", required: true },
});

genreSchema.virtual("url").get(function(){
  return `/catalog/genre/${this._id}`;
});

module.exports = mongoose.model("genre", genreSchema);