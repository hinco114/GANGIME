const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Users = require('../models').USERS_TB;
const Verification = require('../models').VERIFICATIONS_TB;
const b_models = require('../models').BOXES_TB;
const e_models = require('../models').ERRANDS_TB;
const emailConfig = require('../config/config.json')['nodemailer'];
const resSucc = require('./gangime').resSucc;
const createToken = require('./gangime').createToken;
const tokenVerify = require('./gangime').tokenVerify;

router.route('/')
    .post(signUp)
    .get(getUserInfo)
    .put(modifyUser)
    .delete(deleteUser);
router.route('/verify').post(verify);
router.route('/validNickname').post(validNickname);
router.route('/login').post(signIn);
router.route('/resetPass').post(resetPass);
router.route('/boxes')
    .get(getBoxList)
    .post(storeErrand)
    .delete(deleteBoxItem);
router.route('/fcm').post(registerFcm);
router.route('/accounts')
    .post(addAccount)
    .put(addAccount);
router.route('/histories').get(showHistories);

async function verify(req, res, next) {
    try {
        // check validation
        const emailAddr = req.body.userEmail;
        let data = await Users.findOne({where: {userEmail: emailAddr}});
        if (req.body.newUser && data) {
            throw new Error('Email Already Registered');
        } else if (!req.body.newUser && !data) {
            throw new Error('Email Address not found');
        }
        // Generate random number ( 1000~9999 )
        const code = Math.floor(Math.random() * 8999) + 1000;
        let subject = '간김에 서비스 비밀번호 찾기 코드';
        let text = '간김에 서비스를 이용해주셔서 감사합니다.\n비밀번호 찾기 코드는 아래와 같습니다. \nCODE : ' + code;
        if (req.body.newUser) {
            subject = '간김에 서비스 회원가입 코드';
            text = '계정을 활성화 하려면 다음 코드를 회원가입시 입력해주세요. \nCODE : ' + code;
        }
        // send Email
        const mailOption = {
            from: 'hainco@gmail.com',
            to: emailAddr,
            subject: subject,
            text: text
        };
        // While testing, not send email
        // await sendEmail(mailOption);
        // Add to DB CODE value
        const ret = await addCode(emailAddr, code);
        resSucc(res, ret);
    } catch (err) {
        next(err);
    }
}
async function validNickname(req, res, next) {
    try {
        const condtions = {
            where: {userNickname: req.body.userNickname},
            attributes: ['userIdx']
        };
        // Check validation
        const data = await Users.findOne(condtions);
        if (data) {
            throw new Error('Nickname Already Exist');
        }
        resSucc(res, null);
    } catch (err) {
        next(err);
    }
}


async function signUp(req, res, next) {
    try {
        const body = req.body;
        // Check userEmail and code
        await validCode(body.userEmail, body.code);
        // Password encrypting
        const encryptedPass = await bcrypt.hash(body.userPassword, 10);
        // Create user
        delete body.code;
        body.userPassword = encryptedPass;
        body.userBirthday = new Date(body.userBirthday);
        const ret = await Users.create(body);
        // Delete Verification data
        await Verification.destroy({where: {userEmail: body.userEmail}});
        resSucc(res, {userIdx: ret.userIdx});
    } catch (err) {
        next(err);
    }
}

async function getUserInfo(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        let conditions = {
            where: {userIdx: userIdx},
            attributes: ['userEmail', 'userNickname', 'userBirthday', 'userPhone', 'userDepositor', 'userAccount']
        };
        const data = await Users.findOne(conditions);
        resSucc(res, data);
    } catch (err) {
        next(err);
    }
}

async function modifyUser(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        let conditions = req.body;
        if (!conditions.userPassword) {
            throw new Error('Password required');
        }
        await matchPass(userIdx, conditions.userPassword);
        delete conditions.userPassword;
        if (conditions.newPassword) {
            // replace userPassword to HASH of newPassword
            conditions.userPassword = await bcrypt.hash(conditions.newPassword, 10);
            delete conditions.newPassword;
        }
        // Update user data
        const where = {where: {userIdx: userIdx}};
        await Users.update(conditions, where);
        resSucc(res, {userIdx: userIdx});
    } catch (err) {
        next(err);
    }
}

async function deleteUser(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        let conditions = {
            where: {userIdx: userIdx}
        };
        const data = await Users.destroy(conditions);
        if (data != 1) {
            throw new Error('Unknown delete error');
        }
        resSucc(res, {userIdx: userIdx});
    } catch (err) {
        next(err);
    }
}

async function signIn(req, res, next) {
    try {
        const body = req.body;
        let conditions = {
            where: {userEmail: body.userEmail},
            attributes: ['userIdx', 'userNickname', 'userPassword']
        };
        // Find user
        let result = await Users.findOne(conditions);
        if (!result) {
            throw new Error('User not found');
        }
        result = result.dataValues;
        // Password matching
        await matchPass(result.userIdx, body.userPassword);
        // Create Token
        const token = await createToken(result.userIdx, result.userNickname);
        resSucc(res, {token: token});
    } catch (err) {
        next(err);
    }
}

async function matchPass(userIdx, password) {
    // Find user
    let result = await Users.findById(userIdx);
    if (!result) {
        throw new Error('User not Found');
    }
    result = result.dataValues;
    // Password Matching
    const isMatch = await bcrypt.compare(password, result.userPassword);
    if (!isMatch) {
        throw new Error('Password Not match');
    }
    return true;
}

async function resetPass(req, res, next) {
    try {
        let body = req.body;
        await validCode(body.userEmail, body.code);
        const password = {userPassword: await bcrypt.hash(body.userPassword, 10)};
        const where = {where: {userEmail: body.userEmail}};
        await Users.update(password, where);
        await Verification.destroy(where);
        resSucc(res, null);
    } catch (err) {
        next(err);
    }
}

//TODO: 완성할것
async function addAccount(req, res, next) {
    const decode = await tokenVerify(req.headers);
    const body = req.body;

}

const validCode = async (userEmail, code) => {
    let conditions = {
        where: {userEmail: userEmail},
        attributes: ['code']
    };
    // userEmail and Code matching
    const data = await Verification.findOne(conditions);
    if (!data) {
        throw new Error('Not valid email address')
    } else if (data.dataValues.code != code) {
        throw new Error('Verify code not match')
    }
    return true;
};

const sendEmail = (mailOption) => {
    return new Promise((resolve, reject) => {
        // Mail Setting and send
        const transporter = nodemailer.createTransport(emailConfig);
        transporter.sendMail(mailOption, (err, info, next) => {
            if (err) {
                console.error('Send Mail error : ', err);
                reject(err);
            }
            else {
                console.log('Message sent : ', info);
                resolve();
            }
        });

    });
};

const addCode = (email, code) => {
    const conditions = {
        userEmail: email,
        code: code
    };
    // Delete duplicate data
    Verification.destroy({where: {userEmail: email}});
    // Create data
    return Verification.create(conditions);
};

//////////////////////////////////////////////////////////////////////////////
/* 1. 심부름 찜하기 */
async function storeErrand(req, res, next) {
    const decode = await tokenVerify(req.headers);
    const userIdx = decode.userIdx;
    let errandIdx = req.body.errandIdx;

    try {
        let result = await putIntoBox(userIdx, errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 2. 심부름 찜한 목록 보기 */
async function getBoxList(req, res, next) {
    let startIdx = parseInt(req.query.index) || 1;
    let endIdx = startIdx + 2;
    const decode = await tokenVerify(req.headers);
    const userIdx = decode.userIdx;
    try {
        let result = await findBoxes(startIdx, endIdx, userIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 3. 심부름 찜한 목록 삭제하기 */
async function deleteBoxItem(req, res, next) {
    const decode = await tokenVerify(req.headers);
    const userIdx = decode.userIdx;
    let errandIdx = req.body.errandIdx;

    try {
        let result = await deleteErrand(userIdx, errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 4. FCM 등록하기 */
async function registerFcm(req, res, next) {
    const userIdx = await tokenVerify(req.headers);
    let fcmToken = req.body.fcmToken;

    try {
        await addFcm(userIdx, fcmToken);
        // TODO : (DH) update와 같이 반환되는 값이 없는데 단순하게 이렇게 해도 될지?
        resSucc(res, null);
    } catch (err) {
        next(err);
    }
}

/* 5. 심부름 내역 보기 */
async function showHistories(req, res, next) {
    const token = await tokenVerify(req.headers);
    let startIdx = parseInt(req.query.index) - 1 || 0;
    let category = req.query.category;

    try {
        let result = await getAllHistories(token, startIdx, category);
        res.send({msg: 'success', data: result});
    } catch (err) {
        next(err);
    }
}

/* 1_1 선택한 심부름 찜하기 */
const putIntoBox = (userIdx, errandIdx) => {
    return new Promise(async (resolve, reject) => {
        // TODO : (DH) async-await식으로 다시 변경하기
        const chkExist = await b_models.findOne({
            where: {userIdx: userIdx, errandIdx: errandIdx}
        }).then((chkExist) => {
            if (chkExist === null) {
                const result = b_models.create({userIdx: userIdx, errandIdx: errandIdx});
                resolve(result);
            } else {
                throw new Error('이미 찜한 심부름입니다');
            }
        }).catch((err) => {
            reject(err);
        });
    });
};

/* 2_1  찜한 전체 심부름 목록 가져오기 */
const findBoxes = (startIdx, endIdx, userIdx) => {
    return new Promise((resolve, reject) => {
        const result = b_models.findAll({
            offset: startIdx - 1,
            limit: 5, // TODO : (DH) 페이지
            where: {userIdx: userIdx},
            attributes: ['errandIdx'],
            include: [{
                model: e_models, attributes: ['errandIdx', 'errandTitle',
                    'startStationIdx', 'arrivalStationIdx', 'errandPrice', 'itemPrice']
            }]
        });

        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    })
};

/* 3_1 선택한 심부름 삭제하기 */
const deleteErrand = (userIdx, errandIdx) => {
    return new Promise((resolve, reject) => {
        const result = b_models.destroy({
            where: {errandIdx: errandIdx, userIdx: userIdx}
        });

        if (result) {
            resolve(result);
        }
        else {
            reject('error');
        }
    })
};

/* 4_1 FCM 토큰 정보 저장하기 */
const addFcm = (userIdx, fcmToken) => {
    return new Promise((resolve, reject) => {
        try {
            const result = Users.update({fcmToken: fcmToken}, {where: {userIdx: userIdx}});
            resolve(result);
        } catch (err) {
            reject(err);
        }
    })
};

/* 5_1 수행 또는 요청 심부름 내역 가져오기 */
const getAllHistories = (token, startIdx, category) => {
    return new Promise((resolve, reject) => {
            let user = token.userIdx;
            let requester = "requesterIdx = " + user;
            let executor = "executorIdx = " + user;

            let role = null;
            if (category === "수행") {
                role = executor;
            } else if (category === "요청") {
                role = requester;
            }

            try {
                const result = e_models.sequelize.query("SELECT errandIdx, errandTitle, startStationIdx, arrivalStationIdx, deadlineDt, itemPrice, errandPrice, errandStatus " +
                    "FROM errands_tb WHERE " + role + " ORDER BY CASE WHEN errandStatus='수행중' THEN 1 ELSE 2 END, createdAt DESC LIMIT 10 OFFSET " + startIdx).spread((res, metadata) => {
                    resolve(res);
                });
            } catch (err) {
                reject(err);
            }
        }
    )
};

module.exports = router;