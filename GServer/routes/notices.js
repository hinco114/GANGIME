const express = require('express');
const router = express.Router();
const path = require('path');
const resSucc = require('./gangime').resSucc;
const n_models = require('../models/').NOTICES_TB;

// router.route('/new').get(showAdminPage);
router.route('/')
    .post(postNotice)
    .get(showNoticeList);
router.route('/:noticeIdx').get(showNoticeDetail);

// TODO : (DH) 관리자페이지 index로 옮겨두기
// /* 1. 관리자 페이지 불러오기 */
// function showAdminPage(req, res) {
//     res.sendFile(path.resolve('../public/admin_notice.html'));
// }

/* 1. 공지사항 게시 */
async function postNotice(req, res, next) {
    try {
        if (!req.body.noticeTitle || !req.body.noticeContent) {
            throw new Error("내용 누락");
        }
        const body = req.body;
        const result = await n_models.create(body);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 2. 공지사항 글목록 보기 */
async function showNoticeList(req, res, next) {
    try {
        const startIdx = parseInt(req.query.index) || 1;
        const endIdx = startIdx + 5;
        const result = await getList(startIdx, endIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 3 공지사항 목록 가져오기 */
const getList = (startIdx, endIdx) => {
    return new Promise((resolve, reject) => {
        // TODO : (DH) 가능하면 그냥 return
        try {
            const result = n_models.findAll({
                where: {noticeIdx: {between: [startIdx, endIdx]}},
                attributes: ['noticeIdx', 'noticeTitle', 'createdAt']
            });
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

/* 4. 선택한 공지글 보기 */
async function showNoticeDetail(req, res, next) {
    try {
        let result = await getDetail(req.params.noticeIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 4_1 선택한 공지글 가져오기 */
const getDetail = (noticeIdx) => {
    return new Promise((resolve, reject) => {
        // TODO : (DH) 가능하면 그냥 return
        try {
            const result = n_models.findOne({
                where: {noticeIdx: noticeIdx},
                attributes: ['noticeTitle', 'noticeContent', 'createdAt']
            });
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = router;