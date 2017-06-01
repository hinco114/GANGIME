const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Users = require('../models').USERS_TB;
const Verification = require('../models').VERIFICATIONS_TB;
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
        const userIdx = await tokenVerify(req.headers);
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
        const userIdx = await tokenVerify(req.headers);
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
        const userIdx = await tokenVerify(req.headers);
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
            attributes: ['userIdx', 'userPassword']
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
        const token = await createToken(result.userIdx);
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

module.exports = router;
