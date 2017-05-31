const express = require('express');
const router = express.Router();
const resSucc = require('../gangime');
const e_models = require('../models/').ERRANDS_TB;

router.route('/errand').post(registerErrand);
router.route('/errands/:errandsIdx')
    .get(showErrandDetail);

/* 1. 심부름 등록하기 */
async function registerErrand(req, res, next) {
    let body = req.body;
    //TODO : (다혜) 내용 누락되는 경우 체크?
    try {
        let result = await createErrand(body);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}
/* 2. 심부름 상세내역 보기 */
async function showErrandDetail(req, res, next){
    try{
        let result = await getErrandDetail(req.params.errandsIdx);
        resSucc(res, result);
    } catch(err){
        next(err);
    }
}

/* 1_1 DB에 심부름 등록 */
const createErrand = (body) => {
    return new Promise((resolve, reject) => {
        // TODO: (다혜) token, errandChatId => MongoDB 연결
        const result = e_models.create(body + {requesterIdx:"token", errandChatId:"from Mongo", errandStatus:"입금대기"});
        if (result){
            resolve(result);
        }
        else {
            reject('error');
        }
    });
}

/* 2_1 해당 심부름의 내역 가져오기 */
function getErrandDetail(errandIdx){
    return new Promise((resolve, reject) => {
        const result = models.findOne({
            where: {errandIdx: errandIdx},
            attributes: ['requesterIdx', 'errandTitle', 'errandContent',
                'startStationIdx', 'arrivalStationIdx', 'stationDistance', 'deadlineDt',
                'itemPrice', 'errandPrice', 'errandStatus', 'cancelReason']});
        if(result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
}

module.exports = router;