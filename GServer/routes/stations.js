const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const s_models = require('../models/').STATIONS_TB;

router.route('/').get(getAllStations);
router.route('/closed/').post(getNearStation);

/* 1. 지하철 목록 가져오기 */
async function getAllStations(req, res, next) {
    try {
        let result = await getAllList();
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 2. 가까운 역 찾기 */
async function getNearStation(req, res, next) {
    try {
        let lat = req.body.lat;
        let lon = req.body.lon;
        let result = await findStation(lat, lon);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 모든 지하철 정보 가져오기 */
const getAllList = () => {
    return new Promise((resolve, reject) => {
        try {
            const result = s_models.findAll({
                attributes: ['stationIdx', 'stationName', 'stationLocation']
            });
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

/* 2_1 현재 위치에서 가장 가까운 역 찾기 */
const findStation = (lat, lon) => {
    return s_models.findAll({
        limit: 1,
        attributes: ['stationName'],
        order: [s_models.sequelize.fn('ST_DISTANCE', s_models.sequelize.col('stationLocation'),
            s_models.sequelize.fn('ST_GeomFromText', `POINT(${lat} ${lon})`)), 'ASC']
    })
};

module.exports = router;