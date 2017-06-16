const express = require('express');
const router = express.Router();
const path = require('path');
const models = require('../models');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});
router.route('/admin').get(showAdminPage);

/*1. 관리자 페이지 */
function showAdminPage(req, res) {
    res.sendFile(path.resolve('./public/admin_notice.html'));
}

module.exports = router;
