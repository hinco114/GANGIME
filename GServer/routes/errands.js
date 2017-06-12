const express = require('express');
const router = express.Router();
const schedule = require('node-schedule');
const resSucc = require('./gangime').resSucc;
const tokenVerify = require('./gangime').tokenVerify;
const Errands = require('../models/').ERRANDS_TB;
const Cancel = require('../models/').CANCEL_TB;
const Stars = require('../models/').STARS_TB;
const Boxes = require('../models/').BOXES_TB;
const Users = require('../models/').USERS_TB;
const Stations = require('../models/').STATIONS_TB;
const errandChats = require('../models/').errandChats;

router.route('/')
    .post(registerErrand)
    .get(getStationsErrands);
router.route('/:errandIdx')
    .get(showErrandDetail)
    .post(editErrand);
router.route('/:errandIdx/cancel').post(requestCancel);
router.route('/:errandIdx/star').post(evaluateErrand);
router.route('/:errandIdx/ask').post(askErrand);
router.route('/:errandIdx/accept').post(acceptErrand);
router.route('/:errandIdx/reject').post(rejectErrand);
router.route('/:errandIdx/chats')
    .post(addChats)
    .get(getChats);
router.route('/:errandIdx/accept').post(acceptErrand);
router.route('/errands/:errandsIdx/deposit').post(processDeposit);
router.route('/errands/:errandsIdx/refund').post(processRefund);

/* 1. 심부름 등록하기 */
async function registerErrand(req, res, next) {
    try {
        if (!req.body) {
            throw new Error('Contents not exist');
        }
        let body = req.body;
        let token = await tokenVerify(req.headers);
        let userIdx = token.userIdx;
        let result = await createErrand(body, userIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 DB에 심부름 등록 */
const createErrand = (body, userIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            let s_location = await Stations.findById(body.startStationIdx, {attributes: ['stationLocation']}); // TODO : (DH) degree => meter로 변환
            let a_location = await Stations.findById(body.arrivalStationIdx, {attributes: ['stationLocation']});
            let s_lat = s_location.dataValues.stationLocation.coordinates[0];
            let s_lon = s_location.dataValues.stationLocation.coordinates[1];
            let a_lat = a_location.dataValues.stationLocation.coordinates[0];
            let a_lon = a_location.dataValues.stationLocation.coordinates[1];
            let distances = await getDistance(s_lat, s_lon, a_lat, a_lon);

            let inputData = body;
            inputData.requesterIdx = userIdx;
            inputData.errandStatus = '입금대기중';
            inputData.stationDistance = distances.dataValues.stationDistance;

            let result = await Errands.create(inputData);
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

/* 1_2 지하철역 간의 거리 구하기 */
const getDistance = (s_lat, s_lon, a_lat, a_lon) => {
    return Stations.findOne({
        attributes: [[Stations.sequelize.fn('ST_DISTANCE', Stations.sequelize.fn('ST_GeomFromText', `POINT(${s_lat} ${s_lon})`),
            Stations.sequelize.fn('ST_GeomFromText', `POINT(${a_lat} ${a_lon})`)), 'stationDistance']]
    })
};

/* 2. 심부름 상세내역 보기 */
async function showErrandDetail(req, res, next) {
    try {
        if (!req.params.errandIdx) {
            throw new Error('errandIdx not exist');
        }
        let errandIdx = req.params.errandIdx;
        let result = await getErrandDetail(errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 2_1 해당 심부름의 내역 가져오기 */
const getErrandDetail = (errandIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            let inputData = ['requesterIdx', 'executorIdx', 'errandTitle', 'errandContent',
                'startStationIdx', 'arrivalStationIdx', 'deadlineDt', 'itemPrice',
                'errandPrice', 'errandStatus'];

            let statusChk = await Errands.findOne({
                where: {errandIdx: errandIdx}, attributes: ['errandStatus']
            });

            let result = null;
            if (statusChk.dataValues.errandStatus === '취소완료') {
                result = await Errands.findOne({
                    include: [{model: Cancel, attributes: ['cancelReason']}],
                    where: {errandIdx: errandIdx}, attributes: inputData
                });
                await result.forEach(rs => {
                    rs.dataValues.cancelReason = rs.dataValues.CANCEL_TBss[0].cancelReason;
                    delete rs.dataValues.CANCEL_TBs_TBs;
                });
            } else {
                result = Errands.findOne({where: {errandIdx: errandIdx}, attributes: inputData});
            }
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

/* 3. 심부름 수정하기 */
async function editErrand(req, res, next) {
    try {
        if (!req.body) {
            throw new Error('Contents not exist');
        }
        if (!req.params.errandIdx) {
            throw new Error('errandIdx not exist');
        }
        let body = req.body;
        let errandIdx = req.params.errandIdx;
        let token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        await editErrandContent(body, errandIdx, userIdx);
        resSucc(res, null);
    } catch (err) {
        next(err);
    }
}

/* 3_1 새로운 내용으로 심부름 수정하기 */
const editErrandContent = (body, errandIdx, userIdx) => {
    return new Promise(async (resolve, reject) => {
        let result = null;
        try {
            let statusChk = await Errands.findOne({
                where: {errandIdx: errandIdx}, attributes: ['errandStatus']
            });

            if (statusChk.dataValues.errandStatus === '입금대기중') {
                result = Errands.update(
                    body, {where: {requesterIdx: userIdx, errandIdx: errandIdx}, returning: true});
                resolve(result);
            } else {
                throw new Error('Cannot edit contents');
            }
        } catch (err) {
            reject(err);
        }
    });
};

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
        next(err);
    }
}

/* 6. 채팅내용 가져오기 */
async function getChats(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        const userNickname = decode.userNickname;
        let errandIdx = req.params.errandIdx;
        const errand = await Errands.findById(errandIdx);
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
        let user = await Users.findById(opponent);
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
        let token = await tokenVerify(req.headers);
        let errandIdx = req.params.errandIdx;
        let result = await askToRequester(token, errandIdx);
        if (result.dataValues.errandStatus === '신청진행중') {
            Errands.update(
                {errandStatus: '매칭대기중'}, {where: {errandIdx: errandIdx}, returning: true});
        }
        // resSucc(res, result);
        res.send({msg: 'success'});
    } catch (err) {
        next(err);
    }
}

/* 7. 심부름 요청 승낙 */
async function acceptErrand(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        let result = await Errands.findById(req.params.errandIdx);
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
        let token = await tokenVerify(req.headers);
        let errandIdx = req.params.errandIdx;
        let result = await cancelAdd(token, errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 9. 지하철역에 따른 심부름 목록 불러오기*/
async function getStationsErrands(req, res, next) {
    try {
        let decode = null;
        if (req.headers.token) {
            decode = await tokenVerify(req.headers);
        }
        let startIdx = parseInt(req.query.index) - 1 || 0;
        let startStation = req.query.start;
        let arrivalStation = req.query.arrival;
        let order = req.query.order || 'time';

        // if (!startStation) {
        //     throw new Error('startStation value is not exist');
        // }
        if (!order) {
            throw new Error('order value is not exist')
        }

        let result = await getErrandList(decode, startIdx, startStation, arrivalStation, order);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 10. 관리자 페이지 : 입금 처리 */
async function processDeposit(req, res, next) {
    try {
        // TODO : (DH) Html에서 errandsIdx를 input에서 입력받아서 url 쿼리에 넣을 수 있는지 알아보고는 수정하기
        let errandIdx = req.body.errandIdx;
        let result = await applyDeposit(errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 10_1 해당 심부름 상태 '매칭대기중'으로 수정 */
const applyDeposit = (errandIdx) => {
    return Errands.update({errandStatus: '매칭대기중'}, {where: {errandIdx: errandIdx}, returning: true});
};

/* 11. 관리자 페이지 : 환불 처리 */
async function processRefund(req, res, next) {
    try {
        let errandIdx = req.body.errandIdx;
        let result = await applyRefund(errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 11_1 해당 심부름 상태 '취소완료'으로 수정 */
const applyRefund = (errandIdx) => {
    return Errands.update({errandStatus: '취소완료'}, {where: {errandIdx: errandIdx}, returning: true});
};

async function addChats(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        let errandIdx = req.params.errandIdx;
        const errand = await Errands.findById(errandIdx);
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

/* 4_1 심부름 취소 요청 정보 등록하기 */
const registerCancel = (userIdx, errandIdx, reason) => {
    return new Promise(async (resolve, reject) => {
        try {
            let findTarget = await Errands.findOne({
                where: {errandIdx: errandIdx},
                attributes: ['requesterIdx', 'executorIdx']
            });
            let requesterIdx = findTarget.dataValues.requesterIdx;
            let executorIdx = findTarget.dataValues.executorIdx;
            let targetUserIdx = (requesterIdx === userIdx) ? executorIdx : requesterIdx;

            await Cancel.create(
                {errandIdx: errandIdx, targetUserIdx: targetUserIdx, cancelReason: reason});

            let changeStatus = await Errands.update(
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
        let result = Stars.create({
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

/* 6_1 스케줄러 사용해서 수행 요청 작업 */
const askToRequester = (token, errandIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userIdx = token.userIdx;
            let startTime = new Date(Date.now());
            let endTime = new Date(startTime.getTime() + 50000); // TODO: (DH) 시간 변경하기, 현재는 테스트 시간으로 설정함

            const askExecuting = await Errands.update(
                {errandStatus: '신청진행중', executorIdx: userIdx}, {where: {errandIdx: errandIdx}, returning: true});

            const countTimer = await schedule.scheduleJob({start: startTime, end: endTime}, () => {
                const restResult = Errands.findOne({
                    where: [{errandIdx: errandIdx}], attributes: ['errandStatus']
                });
                countTimer.cancel();
                resolve(restResult);
            });
        } catch (err) {
            reject(err);
        }
    })
};

/* 8_1 요청이 들어온 심부름 거절하기 */
const cancelAdd = (token, errandIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userIdx = token.userIdx;
            let cancelExecutor = await Errands.update(
                {executorIdx: null},
                {where: {errandIdx: errandIdx, errandStatus: '신청진행중'}, returning: true});
            resolve(cancelExecutor);
        } catch (err) {
            reject(err);
        }
    })
};

/* 9_1 조건에 맞는 심부록 목록 불러오기 */
const getErrandList = (decode, startIdx, startStation, arrivalStation, order) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = decode ? decode.userIdx : null;
            let both = {startStationIdx: startStation, arrivalStationIdx: arrivalStation};
            let only = {startStationIdx: startStation};
            let stations = (!arrivalStation) ? only : both;

            let selectOrder = null;
            if (order === 'time') {
                selectOrder = 'createdAt';
            } else if (order === 'distance') {
                selectOrder = 'stationDistance';
            } else if (order === 'price') {
                selectOrder = 'errandPrice';
            }
            const doingResult = await Errands.findAll({
                include: [{model: Boxes, attributes: ['boxIdx']}],
                where: [{errandStatus: '진행중'}, {$or: [{requesterIdx: user}, {executorIdx: user}]}],
                attributes: ['errandIdx', 'errandTitle', 'startStationIdx', 'arrivalStationIdx',
                    'itemPrice', 'errandPrice', 'errandStatus']
            });
            let condition = {

                include: [{model: Boxes, attributes: ['boxIdx']}],
                where: [stations, {errandStatus: '매칭대기중'}],
                attributes: ['errandIdx', 'errandTitle', 'startStationIdx', 'arrivalStationIdx',
                    'itemPrice', 'errandPrice', 'errandStatus'],
                order: [[selectOrder, 'DESC']]
            };
            if (!startStation) {
                delete condition.where[0];
            }
            const restResult = await Errands.findAll(condition);
            // TODO : (DH) concat 및 다시 작업진행하기

            // TODO : (DH) 페이지네이션 제대로 설정하기 => slice 사용(6번. 채팅 참고하기
            let result = await doingResult.concat(restResult);
            await restResult.forEach(result => {
                if (typeof result.dataValues.BOXES_TBs[0] === 'undefined') {
                    delete result.dataValues.BOXES_TBs;
                } else {
                    result.dataValues.boxIdx = result.dataValues.BOXES_TBs[0].boxIdx;
                    delete result.dataValues.BOXES_TBs;
                }
            });
            resolve(result);
        } catch (err) {
            reject(err);
        }
    })
};

module.exports = router;