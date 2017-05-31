const express = require('express');
const router = express.Router();
const resSucc = require('./gangime');
const token_verify = require('../token_verify');
const r_models = require('../models/').REPORTS_TB;
const e_models = require('../models/').ERRANDS_TB;

// router.route('/reports').get(reportUser);

// /* 1. 신고하기 */
// async function reportUser(req, res, next){
//     let errandIdx = req.body.errandIdx;
//     let reportContent = req.body.reportContent;
//     let token = req.headers['token']; // 토큰
//     let decodedToken = token_verify(token);
//
//     if (!errandIdx || !reportContent) throw new Error("내용 누락");
//     // 유저 인덱스 존재 여부 체크
//     try{
//         let result = await createReport(decodedToken.userIdx, errandIdx, reportContent);
//         resSucc(res, result);
//     } catch(err){
//         next(err);
//     }
// }
//
// /* 1_1 DB에 신고 등록하기 */
// const createReport = (userIdx, errandIdx, reportContent) => {
//     return new Promise((resolve, reject) => {
//         const result = r_models.create({userIdx: userIdx, errandIdx: errandIdx, reportContent: reportContent});
//             // n_models.findOne({
//             // where: {noticeIdx: noticeIdx},
//             // attributes: ['noticeTitle', 'noticeContent', 'createdAt']});
//         if(result) resolve(result);
//         else reject('error');
//     });
// }

module.exports = router;