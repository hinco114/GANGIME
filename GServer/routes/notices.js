const express = require('express');
const router = express.Router();
const resSucc = require('./gangime').resSucc;
const Notices = require('../models/').NOTICES_TB;

router.route('/')
    .post(postNotice)
    .get(showNoticeList);
router.route('/:noticeIdx').get(showNoticeDetail);

/* 1. 공지사항 게시 */
async function postNotice(req, res, next) {
    try {
        if (!req.body.noticeTitle || !req.body.noticeContent) {
            throw new Error("Notice contents not exist");
        }
        const body = req.body;
        const result = await Notices.create(body);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 2. 공지사항 글목록 보기 */
async function showNoticeList(req, res, next) {
    try {
        const startIdx = req.query.index - 1 || 0;
        const result = await getAllNoticesList(startIdx);
        result.start = startIdx;
        result.end = startIdx + 10;
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 2_2 공지사항 목록 가져오기 */
const getAllNoticesList = (startIdx) => {
    return Notices.findAll({
        offset: startIdx,
        limit: 10,
        attributes: ['noticeIdx', 'noticeTitle', 'createdAt']
    });
};

/* 3. 선택한 공지글 보기 */
async function showNoticeDetail(req, res, next) {
    try {
        const noticeIdx = req.params.noticeIdx;
        const result = await getDetail(noticeIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 3_1 선택한 공지글 가져오기 */
const getDetail = (noticeIdx) => {
    return Notices.findOne({
        where: {noticeIdx: noticeIdx},
        attributes: ['noticeTitle', 'noticeContent', 'createdAt']
    });
};

module.exports = router;