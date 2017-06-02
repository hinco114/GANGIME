const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const b_models = require('../models/').BANKS_TB;

router.route('/').get(showBanks);

/* 1. 은행 목록 보여주기 */
async function showBanks(req, res, next) {
    try {
        let result = await getAllBank();
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 은행 목록 가져오기 */
const getAllBank = () => {
    return new Promise((resolve, reject) => {
        const result = b_models.findAll({
            attributes: ['bankIdx', 'bankName', 'bankImageUrl']
        });
        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
};

module.exports = router;