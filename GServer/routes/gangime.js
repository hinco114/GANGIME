const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/config.json')['jwt'];

const resSucc = (res, data) => {
    let resultModel = {
        msg: 'success'
    };
    if (Array.isArray(data)) {
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
    return new Promise((resolve, reject) => {
        try {
            if (!headers.token) {
                throw new Error("Token not in Headers");
            }
            const decoded = jwt.verify(headers.token, jwtConfig.SECRET_KEY);
            resolve(decoded.userIdx);
        } catch (err) {
            reject(err);
        }
    })
}

async function createToken(userIdx) {
    try {
        const token = jwt.sign({userIdx: userIdx}, jwtConfig.SECRET_KEY, {expiresIn: jwtConfig.EXPIRES});
        return token;
    } catch (err) {
        next(err);
    }
}

module.exports.resSucc = resSucc;
module.exports.tokenVerify = tokenVerify;
module.exports.createToken = createToken;