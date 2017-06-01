const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const tokenVerify = require('./gangime').tokenVerify;
const r_models = require('../models/').REPORTS_TB;

router.route('/reports').get(reportUser);

/* 1. 신고하기 */
async function reportUser(req, res, next) {
    let errandIdx = req.body.errandIdx;
    let reportContent = req.body.reportContent;
    let token = req.headers['token'];
    let decodedToken = null;

    if (token) {
        decodedToken = tokenVerify(token);
    } else {
        throw new Error("토큰 누락");
    }

    if (!errandIdx || !reportContent) {
        throw new Error("내용 누락");
    }
    // TODO : DH_토큰에서 받아온 유저 인덱스 DB에 존재하는지 여부 체크?
    try {
        let result = await createReport(decodedToken, errandIdx, reportContent);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 DB에 신고 등록하기 */
const createReport = (userIdx, errandIdx, reportContent) => {
    return new Promise((resolve, reject) => {
        const result = r_models.create({userIdx: userIdx, errandIdx: errandIdx, reportContent: reportContent});
        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
}

module.exports = router;