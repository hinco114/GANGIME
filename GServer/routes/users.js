const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Users = require('../models').USERS_TB;
const Verification = require('../models').VERIFICATIONS_TB;
const emailConfig = require('../config/config.json')['nodemailer'];
const jwtConfig = require('../config/config.json')['jwt'];
const resSucc = require('../gangime');
const jwt = require('jsonwebtoken');

router.route('/verify').post(verify);
router.route('/validNickname').post(validNickname);
router.route('/')
    .post(signUp);
router.route('/login')
    .post(signIn);

async function verify(req, res, next) {
    try {
        // check duplication
        const emailAddr = req.body.userEmail;
        let data = await findUser(emailAddr);
        if (data) {
            throw new Error("Email Already Registered");
        }
        // send Email
        const code = await sendEmail(emailAddr);

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
        // Find duplicate data
        const data = await Users.findOne(condtions);
        if (!data) {
            // if null
            resSucc(res, null);
        } else {
            // if not null
            throw new Error("Nickname Already Exist");
        }
    } catch (err) {
        next(err);
    }
}


async function signUp(req, res, next) {
    try {
        const body = req.body;
        // Check emailAddress and code
        await validCode(body.userEmail, body.code, next);
        // Password encrypting
        const encryptedPass = await bcrypt.hash(body.userPassword, 10);
        // Create user
        delete body.code;
        body.userPassword = encryptedPass;
        const year = body.userBirthday.substring(0,4);
        const month = body.userBirthday.substring(4,6) - 1;
        const day = body.userBirthday.substring(6,8);
        body.userBirthday = new Date(year, month, day).toLocaleDateString();
        const ret = await Users.create(body);
        // Delete Verification data
        await Verification.destroy({where: {emailAddress: body.userEmail}});
        resSucc(res, {userIdx: ret.userIdx});
    } catch (err) {
        next(err);
    }
}

async function signIn(req, res, next) {
    try {
        const body = req.body;
        // Password Matching
        let conditions = {
            where: {userEmail: body.userEmail},
            attributes: ['userPassword']
        };
        let result = await Users.findOne(conditions);
        result = result.dataValues;
        const isMatch = await bcrypt.compare(body.userPassword, result.userPassword);
        // Return jwt
        const token = jwt.sign({userIdx: result.userIdx}, jwtConfig.SECRET_KEY, {expiresIn: jwtConfig.EXPIRES});
        resSucc(res, token);
    } catch (err) {
        next(err);
    }
}

const validCode = (userEmail, code, next) => {
    return new Promise((resolve, reject) => {
        let conditions = {
            where: {emailAddress: userEmail},
            attributes: ['code']
        };
        // userEmail and Code matching
        Verification.findOne(conditions).then((result) => {
            if (!result) {
                reject(new Error("Not valid email address"))
            } else if (result.dataValues.code == code) {
                resolve(true);
            } else {
                reject(new Error("Verify code not match"))
            }
        }).catch((err) => {
            next(err);
        })
    });
};


const findUser = (emailAddr) => {
    const conditions = {
        where: {userEmail: emailAddr},
        attributes: ['userIdx']
    };
    return Users.findOne(conditions);
};

const sendEmail = (emailAddr) => {
    return new Promise((resolve, reject) => {
        const mailTo = emailAddr;
        // Generate random number ( 1000~9999 )
        const code = Math.floor(Math.random() * 8999) + 1000;
        // Mail Setting and send
        const transporter = nodemailer.createTransport(emailConfig);
        const mailOption = {
            from: 'tacademy.server@gmail.com',
            to: mailTo,
            subject: '간김에 서비스 회원가입 코드',
            text: '계정을 활성화 하려면 다음 코드를 회원가입시 입력해주세요. \nCODE : ' + code
        };

        transporter.sendMail(mailOption, (err, info, next) => {
            if (err) {
                console.error('Send Mail error : ', err);
                reject(err);
            }
            else {
                console.log('Message sent : ', info);
                resolve(code);
            }
        });

    });
};

const addCode = (email, code) => {
    const conditions = {
        emailAddress: email,
        code: code
    };
    // Delete duplicate data
    Verification.destroy({where: {emailAddress: email}});
    // Create data
    return Verification.create(conditions);
};

module.exports = router;
