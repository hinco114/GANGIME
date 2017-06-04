const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    errandIdx: Number,
    executorIdx: Number,
    requesterIdx: Number,
    chats: [{
        sender: Number,
        message: String,
        dateDt: {type: Date, default: Date.now}
    }]
});

module.exports = mongoose.model('errandChats', chatSchema);