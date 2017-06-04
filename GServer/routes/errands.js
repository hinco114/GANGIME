const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const tokenVerify = require('./gangime').tokenVerify;
const e_models = require('../models/').ERRANDS_TB;
const c_models = require('../models/').CANCEL_TB;
const b_models = require('../models/').BOXES_TB;

router.route('/').post(registerErrand);
router.route('/:errandsIdx')
    .get(showErrandDetail)
    .put(editErrand);
router.route('/:errandsIdx/cancel')
    .post(requestCancel);

/* 1. 심부름 등록하기 */
async function registerErrand(req, res, next) {
    let body = req.body;
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

/* 3. 심부름 수정하기 */
async function editErrand(req, res, next) {
    try {
        let body = req.body;
        let errandIdx = req.params.errandsIdx;
        let userIdx = await tokenVerify(req.headers);
        let result = await sendNewErrand(body, errandIdx, userIdx);
        // resSucc(res, result);
        res.send({msg: 'success', data: ''});
    } catch (err) {
        next(err);
    }
}

/* 4. 상대방에게 심부름 취소 요청하기 */
async function requestCancel(req,res, next){
    try {
        let userIdx = await tokenVerify(req.headers);
        let errandIdx = req.params.errandsIdx;
        let reason = req.body.cancelReason;
        let result = await registerCancel(userIdx, errandIdx, reason);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 DB에 심부름 등록 */
const createErrand = (body, userIdx) => {
    return new Promise((resolve, reject) => {
        let inputData = body;
        inputData.requesterIdx = userIdx;
        inputData.errandChatId = 'chatId'; // TODO: errandChatId => MongoDB 연결
        inputData.errandStatus = '입금대기';

        const result = e_models.create(inputData);
        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
};

/* 2_1 해당 심부름의 내역 가져오기 */
const getErrandDetail = (errandIdx) => {
    return new Promise(async (resolve, reject) => {
        let inputData = ['requesterIdx', 'errandTitle', 'errandContent',
            'startStationIdx', 'arrivalStationIdx', 'stationDistance',
            'deadlineDt', 'itemPrice', 'errandPrice', 'errandStatus'];
        let result = null;

        try {
            let statusChk = await e_models.findOne({
                where: {errandIdx: errandIdx}, attributes: ['errandStatus']
            });

            if (statusChk.dataValues.errandStatus === '취소완료') { // status = "취소완료"일 때만 cancelReason 컬럼 반환
                result = e_models.findOne({
                    include: [{model: c_models, attributes: ['cancelReason']}],
                    where: {errandIdx: errandIdx},
                    attributes: inputData
                });
            } else {
                result = e_models.findOne({
                    where: {errandIdx: errandIdx},
                    attributes: inputData
                });
            }
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

/* 3_1 새로운 내용으로 심부름 수정하기 */
const sendNewErrand = (body, errandIdx, userIdx) => {
    return new Promise(async (resolve, reject) => {
        let result = null;
        try {
            let statusChk = await e_models.findOne({
                where: {errandIdx: errandIdx}, attributes: ['errandStatus']
            });

            if (statusChk.dataValues.errandStatus === '입금대기') {
                result = e_models.update(
                    body, {where: {requesterIdx: userIdx, errandIdx: errandIdx}, returning: true});
                resolve(result);
            } else {
                throw new Error('수정 불가능한 상태입니다');
            }
        } catch (err) {
            reject(err);
        }
    });
};

/* 4_1 심부름 취소 정보 등록하기 */
const registerCancel = (userIdx, errandIdx, reason) => {
    return new Promise((resolve, reject) => {
        // 해당 심부름 정보를 취소 테이블에 저장하기
        // 심부름의 상태를 취소대기중으로 변경
    })
}


module.exports = router;