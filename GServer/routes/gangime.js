const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/config.json')['jwt'];
const Users = require('../models').USERS_TB;

const resSucc = (res, data) => {
    let resultModel = {
        msg: 'success'
    };
    if (data.chats) {
        resultModel.total = data.chats.length;
        resultModel.index = {
            start: data.start,
            end: data.end
        }
    } else if (Array.isArray(data)) {
        resultModel.total = data.length;
        const idxName = Object.keys(data[0].dataValues)[0];
        resultModel.index = {
            start: data[0][idxName],
            end: data[data.length - 1][idxName]
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
        const token = jwt.sign({userIdx: userIdx, userNickname: userNickname}, jwtConfig.SECRET_KEY, {expiresIn: jwtConfig.EXPIRES});
        return token;
    } catch (err) {
        next(err);
    }
}

module.exports.resSucc = resSucc;
module.exports.tokenVerify = tokenVerify;
module.exports.createToken = createToken;