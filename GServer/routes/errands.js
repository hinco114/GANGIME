const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const tokenVerify = require('./gangime').tokenVerify;
const e_models = require('../models/').ERRANDS_TB;
const c_models = require('../models/').CANCEL_TB;
const s_models = require('../models/').STARS_TB;
const u_models = require('../models/').USERS_TB;
const errandChats = require('../models/').errandChats;

router.route('/')
    .post(registerErrand);
// .get(getStationsErrands);
router.route('/:errandIdx')
    .get(showErrandDetail)
    .put(editErrand);
router.route('/:errandIdx/cancel').post(requestCancel);
router.route('/:errandIdx/star').post(evaluateErrand);
router.route('/:errandIdx/ask').post(askErrand);
router.route('/:errandIdx/accept').post(acceptErrand);
router.route('/:errandIdx/reject').post(rejectErrand);
router.route('/:errandIdx/chats')
    .post(addChats)
    .get(getChats);
router.route('/:errandIdx/accept').post(acceptErrand);

/* 1. 심부름 등록하기 */
async function registerErrand(req, res, next) {
    let body = req.body;
    const decode = await tokenVerify(req.headers);
    const userIdx = decode.userIdx;
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
        let result = await getErrandDetail(req.params.errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 3. 심부름 수정하기 */
async function editErrand(req, res, next) {
    try {
        let body = req.body;
        let errandIdx = req.params.errandIdx;
        let decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        await sendNewErrand(body, errandIdx, userIdx);
        resSucc(res, null);
    } catch (err) {
        next(err);
    }
}

/* 4. 상대방에게 심부름 취소 요청하기 */
async function requestCancel(req, res, next) {
    try {
        let decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        let errandIdx = req.params.errandIdx;
        let reason = req.body.cancelReason;
        let result = await registerCancel(userIdx, errandIdx, reason);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 5. 심부름 평가하기  */
async function evaluateErrand(req, res, next) {
    try {
        let decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        let errandIdx = req.params.errandIdx;
        let point = parseInt(req.body.stars);
        let result = await addStars(userIdx, errandIdx, point);
        resSucc(res, result);
    } catch (err) {
        next(err)
    }
}

/* 6. 채팅내용 가져오기 */
async function getChats(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        const userNickname = decode.userNickname;
        let errandIdx = req.params.errandIdx;
        const errand = await e_models.findById(errandIdx);
        if (!errand) {
            throw new Error('Errand not found');
        }
        if (!errand.errandChatId) {
            throw new Error('Chat room not Exist');
        }
        let errandChat = await errandChats.findById(errand.errandChatId);
        if (!errandChat || errandChat.chats.length == 0) {
            resSucc(res, null);
            return;
        }
        let opponent = errandChat.requesterIdx == userIdx ? errandChat.executorIdx : errandChat.requesterIdx;
        let index = req.query.index > 1 ? req.query.index - 1 : 0;
        let data = {};
        data.start = index + 1;
        data.end = index + errandChat.chats.length;
        let user = await u_models.findById(opponent);
        data.myNickname = userNickname;
        data.opponentNickname = user.userNickname;
        data.chats = errandChat.chats.slice(index, index + 50);
        resSucc(res, data);
    } catch (err) {
        next(err);
    }
}

/* 6. 심부름 수행 요청 */
async function askErrand(req, res, next) {
    try {
        let userIdx = await tokenVerify(req.headers);
        let result = await addStars(userIdx, errandIdx, point);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 7. 심부름 요청 승낙 */
async function acceptErrand(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        let result = await e_models.findById(req.params.errandIdx);
        const creation = {
            errandIdx: result.dataValues.errandIdx,
            executorIdx: result.dataValues.executorIdx,
            requesterIdx: result.dataValues.requesterIdx,
        };
        const newChat = await errandChats.create(creation);
        result.errandStatus = '수행중';
        result.errandChatId = newChat._id.toString();
        result.save();
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 8. 심부름 요청 거절 */
async function rejectErrand(req, res, next) {
    try {
        let userIdx = await tokenVerify(req.headers);
        let result = await addStars(userIdx, errandIdx, point);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

// /* 9. 지하철역에 따른 심부름 목록 불러오기*/
// async function getStationsErrands(req, res, next) {
//     try {
//         let startIdx = parseInt(req.query.index) || 1;
//         let startStation = req.query.start;
//         let arrivalStation = req.query.arrival;
//         let order = req.query.order; // order : 시간(등록시간), 금액, 거리
//         let result = await getErrandList(startIdx, startStation, arrivalStation, order);
//         resSucc(res, result);
//     } catch (err) {
//         next(err);
//     }
// }

async function addChats(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        let errandIdx = req.params.errandIdx;
        const errand = await e_models.findById(errandIdx);
        if (!errand) {
            throw new Error('Errand not found');
        }
        let result = await errandChats.findById(errand.errandChatId);
        let newChat = {
            sender: userIdx,
            message: req.body.chat
        };
        result.chats.push(newChat);
        result.save();
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

/* 4_1 심부름 취소 요청 정보 등록하기 */
const registerCancel = (userIdx, errandIdx, reason) => {
    return new Promise(async (resolve, reject) => {
        try {
            let findTarget = await e_models.findOne({
                where: {errandIdx: errandIdx},
                attributes: ['requesterIdx', 'executorIdx']
            });
            let requesterIdx = findTarget.dataValues.requesterIdx;
            let executorIdx = findTarget.dataValues.executorIdx;
            let targetUserIdx = (requesterIdx === userIdx) ? executorIdx : requesterIdx;

            await c_models.create(
                {errandIdx: errandIdx, targetUserIdx: targetUserIdx, cancelReason: reason});

            let changeStatus = await e_models.update(
                {errandStatus: "취소요청"}, {where: {errandIdx: errandIdx}, returning: true}
            );
            resolve(changeStatus);
        } catch (err) {
            reject(err);
        }
    })
};

/* 5_1 평가 테이블에 점수 입력하기 */
const addStars = (userIdx, errandIdx, point) => {
    return new Promise((resolve, reject) => {
        let result = s_models.create({
            userIdx: userIdx, errandIdx: errandIdx, point: point
        });
        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    })
};

// /* 9_1 조건에 맞는 심부록 목록 불러오기 */
// const getErrandList = (startIdx, startStation, arrivalStation, order) => {
//     return new Promise((resolve, reject) => {
//         try {
//             const result = e_models.findAll({
//                 offset: startIdx - 1,
//                 limit: 5,
//                 where: {startStationIdx: startStation, arrivalStationIdx: arrivalStation},
//                 // TODO : (DH) arrivalStation 값이 NULL이여도 상관이 없는지 체크
//                 attributes: ['errandIdx', 'errandTitle', 'startStationIdx', 'arrivalStationIdx',
//                     'itemPrice', 'errandPrice', 'errandStatus']
//                 // TODO : (DH) boxIdx 체크한 후에 join해서 받아오기
//                 // TODO : (DH) 시간, 거리, 금액순으로 정렬 설정하기 + 단 '수행중'인 심부름은 항상 상단에 위치
//         });
//             resolve(result);
//         } catch (err) {
//             reject(err);
//         }
//     })
// };

module.exports = router;