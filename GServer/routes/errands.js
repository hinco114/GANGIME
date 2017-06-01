const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const tokenVerify = require('./gangime').tokenVerify;
const e_models = require('../models/').ERRANDS_TB;

router.route('/errand').post(registerErrand);
router.route('/errands/:errandsIdx')
    .get(showErrandDetail);

/* 1. 심부름 등록하기 */
async function registerErrand(req, res, next) {
    let body = req.body;
    // let decodedToken = tokenVerify(req.headers);
    const userIdx = await tokenVerify(req.headers);

    //TODO : DH_내용 누락되는 경우 체크 필요성?
    try {
        let result = await createErrand(body, userIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}
/* 2. 심부름 상세내역 보기 */
async function showErrandDetail(req, res, next) {
    try {
        let result = await getErrandDetail(req.params.errandsIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 DB에 심부름 등록 */
const createErrand = (body, userIdx) => {
    return new Promise((resolve, reject) => {
        // 입력해야하는 부분 추가한 후 DB에서 create
        // TODO: DH_token, errandChatId => MongoDB 연결
        let inputData = body;
        console.log(inputData);
        inputData.requesterIdx = userIdx;
        inputData.errandChatId = 'chatId'; // Mongo
        inputData.errandStatus = '입금대기';

        const result = e_models.create(inputData);
        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
}

/* 2_1 해당 심부름의 내역 가져오기 */
function getErrandDetail(errandIdx) {
    return new Promise((resolve, reject) => {
        let inputData = ['requesterIdx', 'errandTitle', 'errandContent',
            'startStationIdx', 'arrivalStationIdx', 'stationDistance',
            'deadlineDt', 'itemPrice', 'errandPrice', 'errandStatus'];

        // TODO: async-await로 수정
        let statusChk = e_models.findOne({
            where: {errandIdx: errandIdx}, attributes: ['cancelReason']
        });

        if (statusChk == '취소완료') { // status = "취소완료"일 때만 cancelReason 컬럼 반환
            inputData.push('cancelReason');
        }

        const result = e_models.findOne({
            where: {errandIdx: errandIdx},
            attributes: inputData
        });

        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
}

module.exports = router;