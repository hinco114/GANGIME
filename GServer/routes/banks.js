const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const Banks = require('../models/').BANKS_TB;

router.route('/').get(showBankList);

/* 1. 은행 목록 보여주기 */
async function showBankList(req, res, next) {
    try {
        const result = await getBankList();
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 은행 목록 가져오기 */
const getBankList = () => {
    return new Promise((resolve, reject) => {
        // TODO : (DH)  가능하면 바로 return 하기
        try {
            const result = Banks.findAll({
                attributes: ['bankIdx', 'bankName', 'bankImageUrl']
            });
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = router;