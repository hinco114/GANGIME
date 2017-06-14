const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const tokenVerify = require('./gangime').tokenVerify;
const Reports = require('../models/').REPORTS_TB;

router.route('/').post(reportUser);

/* 1. 신고하기 */
async function reportUser(req, res, next) {
    try {
        if (!req.body.errandIdx) {
            throw new Error("errandIdx not exist");
        }
        if (!req.body.reportContent) {
            throw new Error("reportContent not exist");
        }
        const errandIdx = req.body.errandIdx;
        const reportContent = req.body.reportContent;
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const result = await createReport(userIdx, errandIdx, reportContent);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 DB에 신고 등록하기 */
const createReport = (userIdx, errandIdx, reportContent) => {
    return Reports.create({userIdx: userIdx, errandIdx: errandIdx, reportContent: reportContent});
};

module.exports = router;