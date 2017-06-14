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
    return Banks.findAll(
        {attributes: ['bankIdx', 'bankName', 'bankImageUrl']}
    );
};

module.exports = router;