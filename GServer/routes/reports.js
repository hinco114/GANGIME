const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const tokenVerify = require('./gangime').tokenVerify;
const Reports = require('../models/').REPORTS_TB;

router.route('/').post(reportUser);

/* 1. 신고하기 */
async function reportUser(req, res, next) {
    const errandIdx = req.body.errandIdx;
    const reportContent = req.body.reportContent;
    const token = await tokenVerify(req.headers);
    const userIdx = token.userIdx;
    if (!errandIdx || !reportContent) {
        throw new Error("내용 누락");
    }
    try {
        const result = await createReport(userIdx, errandIdx, reportContent);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 DB에 신고 등록하기 */
const createReport = (userIdx, errandIdx, reportContent) => {
    return new Promise((resolve, reject) => {
        // TODO : (DH) 가능하면 바로 return 하기
        try {
            const result = Reports.create({userIdx: userIdx, errandIdx: errandIdx, reportContent: reportContent});
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = router;