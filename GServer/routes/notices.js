const express = require('express');
const router = express.Router();
const path = require('path');
const resSucc = require('../gangime');
const n_models = require('../models/').NOTICES_TB;

router.route('/notices/new').get(showAdminPage);
router.route('/notices')
    .post(postNotice)
    .get(showNoticeList);
router.route('/notices/:noticeIdx').get(showNoticeDetail);

/* 1. 관리자 페이지 불러오기 */
function showAdminPage(req, res) {
    res.sendFile(path.resolve('../public/admin_notice.html'));
}

/* 2. 공지사항 게시 */
async function postNotice(req, res, next) {
    let body = req.body;
    let title = req.body.noticeTitle;
    let content = req.body.noticeContent;
    if (!title || !content) throw new Error("내용 누락");

    try {
        let result = await n_models.create(body);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 3. 공지사항 글목록 보기 */
async function showNoticeList(req, res, next) {
    let startIdx = parseInt(req.query.index) || 1;
    let endIdx = startIdx + 5;

    try {
        let result = await getList(startIdx, endIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 4. 선택한 공지글 보기 */
async function showNoticeDetail(req, res, next) {
    try {
        let result = await getDetail(req.params.noticeIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 3_1 공지사항 목록 가져오기 */
const getList = (startIdx, endIdx) => {
    return new Promise((resolve, reject) => {
        const result = n_models.findAll({
            where: {noticeIdx: {between: [startIdx, endIdx]}},
            attributes: ['noticeIdx', 'noticeTitle', 'createdAt']
        });
        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
}

/* 4_1 선택한 공지글 가져오기 */
const getDetail = (noticeIdx) => {
    return new Promise((resolve, reject) => {
        const result = n_models.findOne({
            where: {noticeIdx: noticeIdx},
            attributes: ['noticeTitle', 'noticeContent', 'createdAt']
        });
        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    });
}

module.exports = router;