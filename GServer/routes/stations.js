const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const s_models = require('../models/').STATIONS_TB;
const l_models = require('../models/').LINES_TB;

router.route('/stations').get(getAllStations);

/* 1. 지하철 목록 가져오기 */
async function getAllStations(req, res, next) {
    try {
        let result = await getAllList();
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 모든 지하철 정보 가져오기 */
const getAllList = () => {
    return new Promise((resolve, reject) => {
        const result = s_models.findAll({
            include: [{model: l_models, attributes: ['lineNumber']}],
            attributes: ['stationIdx', 'stationName', 'stationX', 'stationY']
        });
        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
};

module.exports = router;