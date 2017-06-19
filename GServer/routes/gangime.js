const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/config.json')['jwt'];
const Users = require('../models').USERS_TB;
const FCM = require('fcm-push');
const serverKey = require('../config/config.json')['fcm'].serverKey;
const fcm = new FCM(serverKey);

const resSucc = (res, data) => {
    let resultModel = {
        msg: 'success'
    };

    if (data && data.chats) {
        resultModel.total = data.chats.length;
        resultModel.index = {
            start: data.start,
            end: data.end
        };
        delete data.start;
        delete data.end;
    }

    if (data && typeof data.start !== 'undefined') {
        resultModel.total = data.length;
        let compareNum = (data.end > data.length)? data.length : data.end;
        resultModel.index = {
            start: data.start || 0,
            end: compareNum || 0
        }
    }
    resultModel.data = data ? data : null;
    res.status(200);
    res.json(resultModel);
};

async function tokenVerify(headers) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!headers.token) {
                throw new Error('Token not in Headers');
            }
            const decoded = jwt.verify(headers.token, jwtConfig.SECRET_KEY);
            const existUser = await Users.findById(decoded.userIdx);
            if (!existUser) {
                throw new Error('Invalid Token')
            }
            resolve(decoded);
        } catch (err) {
            reject(err);
        }
    })
}

async function createToken(userIdx, userNickname) {
    try {
        const token = jwt.sign({
            userIdx: userIdx,
            userNickname: userNickname
        }, jwtConfig.SECRET_KEY, {expiresIn: jwtConfig.EXPIRES});
        return token;
    } catch (err) {
        next(err);
    }
}

const getFcmToken = (userIdx) => {
    return Users.findById(userIdx, {attributes: ['fcmToken']});
};

const sendFcmMessage = (message) => {
    fcm.send(message)
        .then(function(response){ // promise 방식
            console.log("Successfully sent with response: ", response);
        })
        .catch(function(err){
            console.log("Something has gone wrong!");
            throw err;
        });
};

module.exports.resSucc = resSucc;
module.exports.tokenVerify = tokenVerify;
module.exports.createToken = createToken;
module.exports.getFcmToken = getFcmToken;
module.exports.sendFcmMessage = sendFcmMessage;