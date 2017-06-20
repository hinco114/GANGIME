const express = require('express');
const router = express.Router();
const schedule = require('node-schedule');
const resSucc = require('./gangime').resSucc;
const tokenVerify = require('./gangime').tokenVerify;
const getFcmToken = require('./gangime').getFcmToken;
const sendFcmMessage = require('./gangime').sendFcmMessage;
const Errands = require('../models/').ERRANDS_TB;
const Cancel = require('../models/').CANCEL_TB;
const Stars = require('../models/').STARS_TB;
const Boxes = require('../models/').BOXES_TB;
const Users = require('../models/').USERS_TB;
const Stations = require('../models/').STATIONS_TB;
const errandChats = require('../models/').errandChats;
let deadlineChk = {};

router.route('/')
    .post(registerErrand)
    .get(getStationsErrands);
router.route('/:errandIdx')
    .get(showErrandDetail)
    .post(editErrand);
router.route('/:errandIdx/cancel').post(requestCancelErrand);
router.route('/:errandIdx/star').post(evaluateErrand);
router.route('/:errandIdx/ask').post(askExecuteErrand);
router.route('/:errandIdx/accept').post(acceptErrand);
router.route('/:errandIdx/reject').post(rejectErrandRequest);
router.route('/:errandIdx/accept').post(acceptErrand);
router.route('/:errandIdx/deposit').post(processDeposit);
router.route('/:errandIdx/refund').post(processRefund);
router.route('/:errandIdx/askDone').post(askErrandDone);
router.route('/:errandIdx/done').post(finishErrand);
router.route('/:errandIdx/chats')
    .post(addChats)
    .get(getChats);

/* 1. 심부름 등록하기 */
async function registerErrand(req, res, next) {
    try {
        const body = req.body;
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const result = await createErrand(body, userIdx);
        resSucc(res, result);
        await saveDeadlineDt(body.deadlineDt, result.dataValues.errandIdx);
    } catch (err) {
        next(err);
    }
}

/* 1_1 DB에 심부름 등록 */
const createErrand = (body, userIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            const s_location = await Stations.findById(body.startStationIdx, {attributes: ['stationLocation']});
            const a_location = await Stations.findById(body.arrivalStationIdx, {attributes: ['stationLocation']});
            const s_lat = s_location.dataValues.stationLocation.coordinates[0];
            const s_lon = s_location.dataValues.stationLocation.coordinates[1];
            const a_lat = a_location.dataValues.stationLocation.coordinates[0];
            const a_lon = a_location.dataValues.stationLocation.coordinates[1];
            const distances = await getDistance(s_lat, s_lon, a_lat, a_lon);

            let inputData = body;
            inputData.requesterIdx = userIdx;
            inputData.errandStatus = '입금대기중';
            inputData.stationDistance = parseInt(distances.dataValues.stationDistance * 111195);
            const result = await Errands.create(inputData);
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

/*1_2 스케줄러 실행을 위한 데이터 저장 */
const saveDeadlineDt = (deadlineDt, errandIdx) => {
    return new Promise((resolve, reject) => {
        try {
            const deadline = deadlineDt.slice(0, 16);
            if (deadlineChk[deadline]) {
                deadlineChk[deadline].push(errandIdx);
            } else {
                deadlineChk[deadline] = [errandIdx];
            }
            // everyFiveCheck();
            resolve();
        } catch (err) {
            reject(err);
        }
    });
};

// /* 5분마다 실행되는 스케줄러 */
// const everyFiveCheck = () => {
//     const everyTimer = schedule.scheduleJob(' */1 * * * *', async () => {
//         const currentTime = formatDate();
//         console.log('현재시간 : ' + currentTime);
//         if (deadlineChk[currentTime]) { // 현재 시간과 마감시간이 동일한게 존재하면 작업 시작
//             await deadlineChk[currentTime].forEach(async (errandIdx) => {
//                 const statusChk = await Errands.findById(errandIdx, {attributes: ['errandStatus']});
//                 if (statusChk.dataValues.errandStatus === '매칭대기중') {
//                     statusChk.errandStatus = '매칭실패';
//                     statusChk.save();
//                 }
//                 delete deadlineChk[currentTime];
//             });
//         }
//     })
// };
//
// /* Date 포맷 */
// const formatDate = () => {
//     let d = new Date(Date.now()),
//         month = '' + (d.getMonth() + 1),
//         day = '' + d.getDate(),
//         year = d.getFullYear(),
//         hour = d.getHours(),
//         minute = '' + d.getMinutes();
//
//     if (month.length < 2) month = '0' + month;
//     if (day.length < 2) day = '0' + day;
//     if(minute.length < 2) minute = '0' + minute;
//     return [year, month, day].join('-') + ' ' + [hour, minute].join(':');
// };

/* 1_3 지하철역 간의 거리 구하기 */
const getDistance = (s_lat, s_lon, a_lat, a_lon) => {
    return Stations.findOne({
        attributes: [[
            Stations.sequelize.fn('ST_DISTANCE',
                Stations.sequelize.fn('ST_GeomFromText', `POINT(${s_lat} ${s_lon})`),
                Stations.sequelize.fn('ST_GeomFromText', `POINT(${a_lat} ${a_lon})`)), 'stationDistance']]
    })
};

/* 2. 심부름 상세내역 보기 */
async function showErrandDetail(req, res, next) {
    try {
        const errandIdx = req.params.errandIdx;
        const result = await getErrandDetail(errandIdx);

        if (result.dataValues.requesterIdx === null) {
            result.dataValues.requesterIdx = -1;
        }
        if (result.dataValues.executorIdx === null) {
            result.dataValues.executorIdx = -1;
        }
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 2_1 해당 심부름의 내역 가져오기 */
const getErrandDetail = (errandIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            let inputData = ['errandIdx', 'requesterIdx', 'executorIdx', 'errandTitle', 'errandContent',
                'startStationIdx', 'arrivalStationIdx', 'deadlineDt', 'itemPrice', 'errandPrice', 'errandStatus'];

            const statusChk = await Errands.findOne({
                where: {errandIdx: errandIdx},
                attributes: ['errandStatus', 'executorIdx']
            });
            let result = null;
            if (statusChk.dataValues.errandStatus === '취소완료' && statusChk.dataValues.executorIdx) {
                result = await Errands.findOne({
                    include: [{model: Cancel, attributes: ['cancelReason']}],
                    where: {errandIdx: errandIdx},
                    attributes: inputData
                });
                result.dataValues.cancelReason = result.dataValues.CANCEL_TBs[0].cancelReason;
                delete result.dataValues.CANCEL_TBs;
            } else {
                result = Errands.findOne({
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

/* 3. 심부름 수정하기 */
async function editErrand(req, res, next) {
    try {
        const body = req.body;
        const errandIdx = req.params.errandIdx;
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const result = await editErrandContent(body, errandIdx, userIdx);
        if (result[0] === 1) {
            res.send({msg: 'success'});
        }
    } catch (err) {
        next(err);
    }
}

/* 3_1 새로운 내용으로 심부름 수정하기 */
const editErrandContent = (body, errandIdx, userIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            const statusChk = await Errands.findOne({
                where: {errandIdx: errandIdx},
                attributes: ['errandStatus']
            });

            if (statusChk.dataValues.errandStatus === '입금대기중') {
                let result = await Errands.update(
                    body, {where: {requesterIdx: userIdx, errandIdx: errandIdx}});
                resolve(result);
            } else {
                throw new Error('Cannot edit errand');
            }
        } catch (err) {
            reject(err);
        }
    });
};

/* 4. 상대방에게 심부름 취소 요청하기 */
async function requestCancelErrand(req, res, next) {
    try {
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const errandIdx = req.params.errandIdx;
        let reason = req.body.cancelReason || null;
        const targetUserIdx = await registerCancelContent(userIdx, errandIdx, reason);
        if (reason) {
            await fcmRequestCancel(errandIdx, targetUserIdx, userIdx);
        }
        resSucc(res, null)
    } catch (err) {
        next(err);
    }
}

/* 4_1 심부름 취소 요청 정보 등록하기 */
const registerCancelContent = (userIdx, errandIdx, reason) => {
    return new Promise(async (resolve, reject) => {
        try {
            const findTarget = await Errands.findOne({
                where: {errandIdx: errandIdx},
                attributes: ['requesterIdx', 'executorIdx']
            });
            const requesterIdx = findTarget.dataValues.requesterIdx;
            const executorIdx = findTarget.dataValues.executorIdx;

            let targetUserIdx = null;
            if (requesterIdx === userIdx) {
                targetUserIdx = executorIdx;
            } else if (executorIdx === userIdx) {
                targetUserIdx = requesterIdx;
            }

            if (!targetUserIdx) {
                await Errands.update(
                    {errandStatus: "취소완료"},
                    {where: {errandIdx: errandIdx}});
            } else {
                if (!reason) {
                    throw new Error('cancelReason not exist');
                }
                await Cancel.create({errandIdx: errandIdx, targetUserIdx: targetUserIdx, cancelReason: reason});
                await Errands.update(
                    {errandStatus: "취소완료"},
                    // {errandStatus: "취소요청중"},
                    {where: {errandIdx: errandIdx}});
            }
            resolve(targetUserIdx);
        } catch (err) {
            reject(err);
        }
    })
};

/* 4_2 취소 통보 FCM */
const fcmRequestCancel = (errandIdx, targetUserIdx, userIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userFcmToken = await getFcmToken(targetUserIdx);
            const errand = await Errands.findById(errandIdx);
            const message = {
                to: userFcmToken.fcmToken, // 상대방 유저 토큰
                data: {
                    pushType: '심부름 취소 요청',
                    errandIdx: errandIdx,
                    userIdx: userIdx,
                    errandStatus: errand.errandStatus,
                    deadlineDt: errand.deadlineDt,
                    startStationIdx: errand.startStationIdx,
                    arrivalStationIdx: errand.arrivalStationIdx
                }
            };
            sendFcmMessage(message);
            resolve();
        } catch (err) {
            reject(err);
        }
    });
};

/* 5. 심부름 평가하기  */
async function evaluateErrand(req, res, next) {
    try {
        if (!req.body.stars) {
            throw new Error('point not exist');
        }
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const errandIdx = req.params.errandIdx;
        const point = req.body.stars;
        const result = await addStars(userIdx, errandIdx, point);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 5_1 평가 테이블에 점수 입력하고 평균값 구해서 저장하기 */
const addStars = (userIdx, errandIdx, point) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await Stars.create({userIdx: userIdx, errandIdx: errandIdx, point: point});
            // TODO : (DH) 따라서 처음 USERS_TB 안에 있는 것의 값이 null이면 0 반환해주기
            const starsAvg = await Stars.findOne({
                attributes: [[Stars.sequelize.fn('AVG', Stars.sequelize.col('point')), 'pointAvg']],
                where: {userIdx: userIdx}
            });
            await Users.update(
                {userStarAvg: starsAvg.dataValues.pointAvg},
                {where: {userIdx: userIdx}}
            );
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });

};

/* 6. 심부름 수행 요청 */
async function askExecuteErrand(req, res, next) {
    // TODO: (SH) 중복 요청에 대한 처리 만들기
    try {
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const errandIdx = req.params.errandIdx;
        const result = await askToRequester(userIdx, errandIdx);
        const ret = {errandStatus: result.errandStatus};
        await fcmAskExecute(errandIdx, userIdx, result.requesterIdx);
        resSucc(res, ret);
    } catch (err) {
        next(err);
    }
}

/* 6_1 심부름 수행 FCM */
const fcmAskExecute = (errandIdx, userIdx, targetUserIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userFcmToken = await getFcmToken(targetUserIdx);
            const errandResult = await Errands.findById(errandIdx, {attributes: ['errandStatus', 'errandTitle', 'errandIdx']});
            const userResult = await Users.findById(userIdx, {attributes: ['userNickname', 'userEmail']});
            const message = {
                to: userFcmToken.dataValues.fcmToken, // 상대방 유저 토큰
                data: {
                    pushType: '심부름 수행 요청',
                    errandIdx: errandResult.dataValues.errandIdx,
                    errandStatus: errandResult.dataValues.errandStatus,
                    errandTitle: errandResult.dataValues.errandTitle,
                    userNickname: userResult.dataValues.userNickname,
                    userEmail: userResult.dataValues.userEmail
                }
            };
            sendFcmMessage(message);
            resolve();
        } catch (err) {
            reject(err);
        }
    });
};

/* 6_1 해당 심부름에 신청 작업 진행 */
const askToRequester = (userIdx, errandIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            const startTime = new Date(Date.now());
            const endTime = new Date(startTime.getTime() + 10000); // TODO: (DH) 시간 변경하기, 현재는 테스트 시간으로 설정함
            const settings = {start: startTime, end: endTime};
            // await countFiveMinutes(settings, errandIdx);
            let errand = await Errands.findById(errandIdx);
            if (errand.errandStatus != '매칭대기중') {
                reject(new Error('Current status is not 매칭대기중'))
            }
            errand.errandStatus = '신청진행중';
            errand.executorIdx = userIdx;
            errand.save();
            resolve(errand);
        } catch (err) {
            reject(err);
        }
    })
};

/* 6_2 스케줄러로 5분 뒤에 심부름 상태 체크하기 */
const countFiveMinutes = (settings, errandIdx) => {
    const countTimer = schedule.scheduleJob(settings, async () => {
        const restResult = await Errands.findOne({
            where: [{errandIdx: errandIdx}],
            attributes: ['errandStatus']
        });
        countTimer.cancel();
        if (restResult.dataValues.errandStatus === '신청진행중') {
            Errands.update(
                {errandStatus: '매칭대기중'},
                {where: {errandIdx: errandIdx}});
        }
        // TODO : 5분 체크 후에 push해서는 심부름 요청에 대한 결과 보내주기
    });
};

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
        // const newChat = await errandChats.create(creation);
        result.errandStatus = '진행중';
        // result.errandChatId = newChat._id.toString();
        result.save();
        const ret = {errandStatus: result.errandStatus};
        resSucc(res, ret);
    } catch (err) {
        next(err);
    }
}

/* 8. 심부름 요청 거절 */
async function rejectErrandRequest(req, res, next) {
    try {
        const token = await tokenVerify(req.headers);
        const errandIdx = req.params.errandIdx;
        const errandResult = await Errands.findById(errandIdx);
        if (errandResult.dataValues.errandStatus === '매칭대기중') {
            throw new Error('Time already gone');
        }

        const userFcmToken = await getFcmToken(errandResult.executorIdx);
        const result = await rejectRequester(errandIdx);
        const message = {
            to: userFcmToken.fcmToken, // 상대방 유저 토큰
            data: {
                pushType: '심부름 요청 거절',
                errandIdx: errandResult.dataValues.errandIdx,
                errandStatus: errandResult.dataValues.errandStatus,
                errandTitle: errandResult.dataValues.errandTitle,
                errandContent: errandResult.dataValues.content,
                startStationIdx: errandResult.dataValues.startStationIdx,
                arrivalStationIdx: errandResult.dataValues.arrivalStationIdx,
                deadlineDt: errandResult.dataValues.deadlineDt,
                itemPrice: errandResult.dataValues.itemPrice,
                errandPrice: errandResult.dataValues.errandPrice
            }
        };
        sendFcmMessage(message);
        if (result[0] === 1) {
            res.send({msg: 'success'});
        }
    } catch (err) {
        next(err);
    }
}

/* 8_1 요청이 들어온 심부름 거절하기 */
const rejectRequester = (errandIdx) => {
    return Errands.update(
        {executorIdx: null, errandStatus: '매칭대기중'},
        {where: {errandIdx: errandIdx}});
};

/* 9. 지하철역에 따른 심부름 목록 불러오기*/
async function getStationsErrands(req, res, next) {
    try {
        let decode = null;
        if (req.headers.token) {
            decode = await tokenVerify(req.headers);
        }
        const startIdx = req.query.index - 1 || 0;

        if (!req.query.start && req.query.arrival) {
            throw new Error('You must enter arrivalStation');
        }
        const startStation = req.query.start;
        const arrivalStation = req.query.arrival;
        const order = req.query.order || 'time';

        const result = await getErrandList(decode, startIdx, startStation, arrivalStation, order);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 9_1 조건에 맞는 심부록 목록 불러오기 */
const getErrandList = (decode, startIdx, startStation, arrivalStation, order) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = decode ? decode.userIdx : null;
            const both = {startStationIdx: startStation, arrivalStationIdx: arrivalStation};
            const only = {startStationIdx: startStation};
            const selectStation = (!arrivalStation) ? only : both;

            let selectOrder = null;
            if (order === 'time') {
                selectOrder = 'createdAt';
            } else if (order === 'distance') {
                selectOrder = 'stationDistance';
            } else if (order === 'price') {
                selectOrder = 'errandPrice'; // TODO : (DH) 심부름 + 물품 가격의 합 구하는 법 찾아보기(시퀄에서는 그냥 +)
            }

            let userDoing = {
                include: [{model: Boxes, attributes: ['boxIdx']}],
                where: [selectStation, {errandStatus: '진행중'}, {$or: [{requesterIdx: user}, {executorIdx: user}]}],
                attributes: ['errandIdx', 'requesterIdx', 'errandTitle', 'startStationIdx', 'arrivalStationIdx',
                    [Errands.sequelize.fn('date_format', Errands.sequelize.col('deadlineDt'), '%m월 %d일 %H시 %i분'), 'deadlineDt'],
                    'itemPrice', 'errandPrice', 'errandStatus'],
                order: [['createdAt', 'DESC']]
            };
            if (!startStation) {
                delete userDoing.where[0];
            }
            if (!user) {
                delete userDoing.where[2];
            }
            const doingResult = await Errands.findAll(userDoing);

            let byStations = {
                include: [{model: Boxes, attributes: ['boxIdx']}],
                where: [selectStation, {errandStatus: '매칭대기중', $not: {requesterIdx: user}}],
                attributes: ['errandIdx', 'requesterIdx', 'errandTitle', 'startStationIdx', 'arrivalStationIdx',
                    [Errands.sequelize.fn('date_format', Errands.sequelize.col('deadlineDt'), '%m월 %d일 %H시 %i분'), 'deadlineDt'],
                    'itemPrice', 'errandPrice', 'errandStatus'],
                order: [[selectOrder, 'DESC']]
            };
            if (!startStation) {
                delete byStations.where[0];
            }
            const restResult = await Errands.findAll(byStations);

            let result = await doingResult.concat(restResult);
            await result.forEach(result => {
                if (typeof result.dataValues.BOXES_TBs[0] === 'undefined') {
                    result.dataValues.boxIdx = -1;
                    delete result.dataValues.BOXES_TBs;
                } else {
                    result.dataValues.boxIdx = result.dataValues.BOXES_TBs[0].boxIdx;
                    delete result.dataValues.BOXES_TBs;
                }
            });
            result = result.slice(startIdx, startIdx + 20);
            result.start = startIdx;
            result.end = startIdx + 20;
            resolve(result);
        } catch (err) {
            reject(err);
        }
    })
};

/* 10. 관리자 페이지 : 입금 처리 */
async function processDeposit(req, res, next) {
    try {
        const errandIdx = req.params.errandIdx;
        const result = await applyDeposit(errandIdx);
        if (result[0] === 1) {
            res.send({msg: 'success'});
        }
    } catch (err) {
        next(err);
    }
}

/* 10_1 해당 심부름 상태 '매칭대기중'으로 수정 */
const applyDeposit = (errandIdx) => {
    return Errands.update(
        {errandStatus: '매칭대기중'},
        {where: {errandIdx: errandIdx}});
};

/* 11. 관리자 페이지 : 환불 처리 */
async function processRefund(req, res, next) {
    try {
        const errandIdx = req.params.errandIdx;
        const result = await applyRefund(errandIdx);
        if (result[0] === 1) {
            res.send({msg: 'success'});
        }
    } catch (err) {
        next(err);
    }
}

/* 11_1 해당 심부름 상태 '취소완료'으로 수정 */
const applyRefund = (errandIdx) => {
    return Errands.update(
        {errandStatus: '취소완료'},
        {where: {errandIdx: errandIdx}});
};

/* 12. 채팅내용 가져오기 */
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

/* 13. 심부름 완료 요청 */
async function askErrandDone(req, res, next) {
    try {
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        let errandIdx = req.params.errandIdx;
        const errand = await Errands.findById(errandIdx);
        if (!errand) {
            throw new Error('Errand not exist');
        } else if (errand.errandStatus != '진행중') {
            throw new Error('Current status is not 진행중')
        }
        const result = await updateAskErrandDone(userIdx, errandIdx);
        const ret = {errandStatus: result};
        resSucc(res, ret)
    } catch (err) {
        next(err);
    }
}

/* 13_1 '완료요청'으로 상태 변경 */
const updateAskErrandDone = (userIdx, errandIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            const errand = await Errands.findById(errandIdx);
            const requesterIdx = errand.dataValues.requesterIdx;
            const executorIdx = errand.dataValues.executorIdx;
            let targetUser = null;
            if (requesterIdx === userIdx) {
                targetUser = executorIdx;
            } else if (executorIdx === userIdx) {
                targetUser = requesterIdx;
            }
            errand.errandStatus = '완료요청중';
            errand.save();
            const userFcmToken = await getFcmToken(targetUser);
            const message = {
                to: userFcmToken.fcmToken, // 상대방 유저 토큰
                data: {
                    pushType: '심부름 완료 요청',
                    errandIdx: errandIdx,
                    errandTitle: errand.errandTitle
                }
            };
            sendFcmMessage(message);
            resolve(errand.errandStatus);
        } catch (err) {
            reject(err);
        }
    });
};

/* 14. 심부름 완료 요청 승낙 */
async function finishErrand(req, res, next) {
    try {
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        let errandIdx = req.params.errandIdx;
        const errand = await Errands.findById(errandIdx);
        if (!errand) {
            throw new Error('Errand not exist');
        }
        const chkStatus = await checkErrandStatus(errandIdx);
        if (chkStatus.dataValues.errandStatus !== '완료요청중') {
            throw new Error('Opponent do not ask completion');
        }

        const result = await updateErrandDone(userIdx, errandIdx);
        if (result[0] === 1) {
            res.send({msg: 'success'});
        }
    } catch (err) {
        next(err);
    }
}

/* 14_1 '수행완료'로 상태 변경 */
const updateErrandDone = (userIdx, errandIdx) => {
    return Errands.update(
        {errandStatus: '심부름완료'},
        {where: {errandIdx: errandIdx}});
};


/* 심부름 상태 체크  */
const checkErrandStatus = (errandIdx) => {
    return Errands.findById(errandIdx, {attributes: ['errandStatus']});
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

module.exports = router;