const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const tokenVerify = require('./gangime').tokenVerify;
const b_models = require('../models/').BOXES_TB;

router.route('/users/boxes').post(storeErrand);

async function storeErrand(req, res, next) {
    const userIdx = await tokenVerify(req.headers);
    let errandIdx = req.body.errandIdx;

    try {
        let result = await putIntoBox(userIdx, errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

const putIntoBox = (userIdx, errandIdx) => {
    return new Promise((resolve, reject) => {
        const result = b_models.create({userIdx: userIdx, errandIdx: errandIdx});
        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
}

module.exports = router;