const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const Stations = require('../models/').STATIONS_TB;

// router.route('/').get(getStationList);
router.route('/closed/').post(getNearStation);

/* 1. 지하철 목록 가져오기 */
async function getStationList(req, res, next) {
    try {
        const result = await getAllList();
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 모든 지하철 정보 가져오기 */
const getAllList = () => {
    return Stations.findAll({attributes: ['stationIdx', 'stationName', 'stationLocation']});
};

/* 2. 가까운 역 찾기 */
async function getNearStation(req, res, next) {
    try {
        if (!req.body.Latitude || !req.body.Longitude) {
            throw new Error('Location not exist');
        }
        const lat = req.body.Latitude;
        const lon = req.body.Longitude;
        const result = await findStation(lat, lon);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 2_1 현재 위치에서 가장 가까운 역 찾기 */
const findStation = (lat, lon) => {
    return Stations.findAll({
        limit: 1,
        attributes: ['stationIdx'],
        order: [[Stations.sequelize.fn('ST_DISTANCE', Stations.sequelize.col('stationLocation'),
            Stations.sequelize.fn('ST_GeomFromText', `POINT(${lat} ${lon})`)), 'ASC']]
    })
};

module.exports = router;