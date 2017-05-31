const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Users = require('../models').USERS_TB;
const Verification = require('../models').VERIFICATIONS_TB;
const resSucc = require('../gangime');
const emailConfig = require('../config/config.json')['nodemailer'];


router.route('/verify').post(verify);
router.route('/validNickname').post(validNickname);
router.route('/')
    .post(signUp);
    // .get()

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
            where: {
                userNickname: req.body.userNickname
            },
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
        await isEqualCode(body.userEmail, body.code);

    } catch (err) {
        next(err);
    }
}

const isEqualCode = (userEmail, code) => {
    return new Promise((resolve, reject) => {
        let conditions = {
            where: {
                userEmail: userEmail
            },
            attributes: code
        };
        const result = Users.findOne(conditions);
        if (result.code == code) {
            resolve(true);
        } else {
            reject(new Error("Verify code not match"))
        }
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
