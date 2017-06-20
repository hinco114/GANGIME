const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sharp = require('sharp');
const fs = require('fs');
const pathUtil = require('path');
const AWS = require('aws-sdk');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});
const Users = require('../models').USERS_TB;
const Verification = require('../models').VERIFICATIONS_TB;
const Boxes = require('../models').BOXES_TB;
const Errands = require('../models').ERRANDS_TB;
const UserStation = require('../models').USER_STATIONS_TB;
const emailConfig = require('../config/config.json')['nodemailer'];
const s3Config = require('../config/config.json')['S3'];
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
    .post(storeErrand);
router.route('/boxes/delete').post(deleteBoxErrand);
router.route('/fcm').post(registerFcm);
router.route('/accounts').post(addAccount);
router.route('/histories').get(showHistories);
router.route('/favoriteStations')
    .post(setFavoriteStation)
    .get(loadFavoriteStations)
    .delete(delFavoriteStation);
router.route('/profiles')
    .post(upload.single('image'), newProfilePic);
router.route('/profiles/:userIdx')
    .get(getProfile);

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
            attributes: ['userIdx', 'userEmail', 'userNickname', 'userBirthday', 'userPhone', 'userDepositor', 'userAccount']
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

async function addAccount(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const body = req.body;
        if (!body.bankIdx && !body.userAccount && !body.userDepositor) {
            throw new Error('Incorrect body message');
        }
        let target = {
            userBankIdx: body.bankIdx,
            userAccount: body.userAccount,
            userDepositor: body.userDepositor
        };
        let where = {
            where: {userIdx: decode.userIdx}
        };
        await Users.update(target, where);
        resSucc(res, null);
    } catch (err) {
        next(err);
    }
}

async function setFavoriteStation(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const body = req.body;
        let result = await UserStation.findAndCountAll({where: {userIdx: decode.userIdx}});
        if (result.count >= 4) {
            throw new Error('Already have 4 Stations');
        }
        const target = {
            userIdx: decode.userIdx,
            stationIdx: body.stationIdx
        };
        result = await UserStation.create(target);
        resSucc(res, {userStaionIdx: result.userStationIdx});
    } catch (err) {
        next(err);
    }
}

async function delFavoriteStation(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const body = req.body;
        if (!body.stationIdx) {
            throw new Error('stationIdx Required');
        }
        const result = await UserStation.destroy({where: {userIdx: decode.userIdx, stationIdx: body.stationIdx}});
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

async function newProfilePic(req, res, next) {
    try {
        const decode = await tokenVerify(req.headers);
        const fileInfo = req.file;
        if (!fileInfo) {
            throw new Error('File not attached')
        }
        const checkExist = await Users.findById(decode.userIdx, {attributes: ['profilePicture']});
        if (checkExist.dataValues.profilePicture != '') {
            const tempStr = checkExist.profilePicture.split('/');
            const key = tempStr[tempStr.length - 1];
            await deleteFromS3(key)
        }
        // Get a new FileName
        const fileName = getItemKey(fileInfo.originalname);
        const img = __dirname + '/../bin/profiles/' + fileName;
        const thumbnail = __dirname + '/../bin/thumbnails/' + fileName;
        // Make a Thumbnail to file
        sharp(fileInfo.path)
            .resize(150)
            .toFile(thumbnail);
        // Upload and get URL
        let result = {
            profilePictureUrl: await uploadToS3(img, fs.createReadStream(fileInfo.path), fileInfo.mimetype),
            profileThumbnailUrl: await uploadToS3(thumbnail, fs.createReadStream(thumbnail), fileInfo.mimetype)
        };
        // Delete Files on disk
        fs.unlinkSync(fileInfo.path);
        fs.unlinkSync(thumbnail);
        // Update user db
        const target = {
            profilePicture: result.profilePictureUrl,
            profileThumbnail: result.profileThumbnailUrl
        };
        const where = {
            where: {
                userIdx: decode.userIdx
            }
        };
        await Users.update(target, where);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

async function getProfile(req, res, next) {
    try {
        const conditions = {
            attributes: ['userIdx', 'userNickname', 'userEmail', 'userPhone', 'userStarAvg', 'profileThumbnail']
        };
        const result = await Users.findById(req.params.userIdx, conditions);
        resSucc(res, result);
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

const uploadToS3 = (itemKey, readStream, mimetype) => {
    return new Promise((resolve, reject) => {
        try {
            // For linux system, used full path of file. Path needs to slice
            const slicedKey = itemKey.slice(itemKey.lastIndexOf('bin/') + 4, itemKey.length);
            // S3 BucketName
            const bucketName = s3Config.bucketName;
            // Params setting
            const params = {
                Bucket: bucketName,
                Key: slicedKey,
                ACL: 'public-read',
                Body: readStream,
                ContentType: mimetype
            };
            // Get settings in config file
            AWS.config.region = s3Config.region;
            AWS.config.accessKeyId = s3Config.accessKeyId;
            AWS.config.secretAccessKey = s3Config.secretAccessKey;
            const s3 = new AWS.S3();
            // Try to upload file
            s3.putObject(params, (err, data) => {
                if (err) {
                    reject(err);
                }
                // If upload is successful, get a url and return
                const imageUrl = s3.endpoint.href + bucketName + '/' + slicedKey;
                resolve(imageUrl);
            });
        } catch (err) {
            console.log('ERR OCCURED : ', err);
        }
    });
};

const deleteFromS3 = (key) => {
    return new Promise((resolve, reject) => {
        const bucketName = s3Config.bucketName;
        // Params setting
        var params = {
            Bucket: bucketName,
            Delete: {
                Objects: [
                    {
                        Key: 'profiles/' + key
                    },
                    {
                        Key: 'thumbnails/' + key
                    }
                ],
                Quiet: false
            }
        };
        AWS.config.region = s3Config.region;
        AWS.config.accessKeyId = s3Config.accessKeyId;
        AWS.config.secretAccessKey = s3Config.secretAccessKey;
        const s3 = new AWS.S3();
        s3.deleteObjects(params, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        })
    })
};

const getItemKey = (originName) => {
    // Create new file name based on DATE
    const extname = pathUtil.extname(originName);
    const now = new Date();
    const itemKey = 'file_' + now.getYear() + now.getMonth() + now.getDay() + now.getHours() + now.getMinutes() + now.getSeconds() + '_' + Math.floor(Math.random() * 1000) + extname;
    return itemKey;
};

/* 1. 심부름 찜하기 */
async function storeErrand(req, res, next) {
    try {
        if (!req.body.errandIdx) {
            throw new Error('errandIdx not exist')
        }
        const decode = await tokenVerify(req.headers);
        const userIdx = decode.userIdx;
        const errandIdx = req.body.errandIdx;
        let result = await putIntoBox(userIdx, errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 1_1 선택한 심부름 찜하기 */
const putIntoBox = (userIdx, errandIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            const chkExist = await Boxes.findOne({where: {userIdx: userIdx, errandIdx: errandIdx}});
            if (chkExist === null) {
                const result = await Boxes.create({userIdx: userIdx, errandIdx: errandIdx});
                resolve(result);
            } else {
                throw new Error('Already stored');
            }
        } catch (err) {
            reject(err);
        }
    });
};

/* 2. 심부름 찜한 목록 보기 */
async function getBoxList(req, res, next) {
    try {
        const startIdx = req.query.index - 1 || 0;
        const endIdx = startIdx + 2;
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        let result = await findBoxeErrands(startIdx, endIdx, userIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 2_1  찜한 전체 심부름 목록 가져오기 */
const findBoxeErrands = (startIdx, endIdx, userIdx) => {
    return new Promise(async (resolve, reject) => {
        try {
            // TODO : (DH) 가능하면 raw query 사용하지 않기
            await Errands.sequelize.query("DELETE B FROM BOXES_TB AS B JOIN ERRANDS_TB AS E ON B.errandIdx=E.errandIdx " +
                "WHERE E.errandStatus!='매칭대기중';");
            const result = await Boxes.findAll({
                offset: startIdx,
                limit: 15,
                where: {userIdx: userIdx},
                attributes: ['errandIdx'],
                order: [['createdAt', 'DESC']],
                include: [{
                    model: Errands, attributes: ['errandTitle', 'startStationIdx', 'arrivalStationIdx',
                        [Errands.sequelize.fn('date_format', Errands.sequelize.col('deadlineDt'), '%m-%d %H:%i'), 'deadlineDt'],
                        'errandStatus', 'errandPrice', 'itemPrice']
                }]
            });

            await result.forEach(result => {
                result.dataValues.errandTitle = result.dataValues.ERRANDS_TB.dataValues.errandTitle;
                result.dataValues.startStationIdx = result.dataValues.ERRANDS_TB.dataValues.startStationIdx;
                result.dataValues.arrivalStationIdx = result.dataValues.ERRANDS_TB.dataValues.arrivalStationIdx;
                result.dataValues.deadlineDt = result.dataValues.ERRANDS_TB.dataValues.deadlineDt;
                result.dataValues.errandStatus = result.dataValues.ERRANDS_TB.dataValues.errandStatus;
                result.dataValues.errandPrice = result.dataValues.ERRANDS_TB.dataValues.errandPrice;
                result.dataValues.itemPrice = result.dataValues.ERRANDS_TB.dataValues.itemPrice;
                delete result.dataValues.ERRANDS_TB;
            });

            result.start = startIdx;
            result.end = startIdx + 15;
            resolve(result);
        } catch (err) {
            reject(err);
        }
    })
};

/* 3. 심부름 찜한 목록 삭제하기 */
async function deleteBoxErrand(req, res, next) {
    try {
        if (!req.body.errandIdx) {
            throw new Error('errandIdx not exist');
        }
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const errandIdx = req.body.errandIdx;
        let result = await deleteErrand(userIdx, errandIdx);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 3_1 선택한 심부름 삭제하기 */
const deleteErrand = (userIdx, errandIdx) => {
    return Boxes.destroy({where: {errandIdx: errandIdx, userIdx: userIdx}});
};

/* 4. FCM 등록하기 */
async function registerFcm(req, res, next) {
    try {
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const fcmToken = req.body.fcmToken;

        const result = await addFcm(userIdx, fcmToken);
        if (result[0] === 1) {
            res.send({msg: 'success'});
        }
    } catch (err) {
        next(err);
    }
}

/* 4_1 FCM 토큰 정보 저장하기 */
const addFcm = (userIdx, fcmToken) => {
    return Users.update(
        {fcmToken: fcmToken},
        {where: {userIdx: userIdx}});
};

/* 5. 심부름 내역 보기(수행,요청) */
async function showHistories(req, res, next) {
    try {
        if (!req.query.category) {
            throw new Error('category not exist');
        }
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const startIdx = req.query.index - 1 || 0;
        const category = req.query.category;
        let result = await getAllHistories(userIdx, startIdx, category);
        resSucc(res, result);
    } catch (err) {
        next(err);
    }
}

/* 5_1 수행 또는 요청 심부름 내역 가져오기 */
// const getAllHistories = (userIdx, startIdx, category) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let inCond;
//             if (category == 'execute') {
//                 inCond = ['신청진행중', '진행중', '취소완료', '완료요청중', '심부름완료'];
//             } else if (category == 'request') {
//                 inCond = ['입금대기중', '매칭대기중', '진행중', '매칭실패', '취소완료', '완료요청중', '심부름완료'];
//             }
//             const condtitions = {
//                 where: {
//                     in: inCond
//                 }
//             }
//         }
//         const result = Errands.let
//         // TODO : (DH) 가능하면 raw query 사용하지 않기
//         const result = await Errands.sequelize.query("SELECT errandIdx, errandTitle, errandContent, startStationIdx, arrivalStationIdx," +
//             "date_format(deadlineDt, '%m.%d') AS `deadlineDt`, itemPrice, errandPrice, errandStatus " +
//             "FROM ERRANDS_TB WHERE " + inputQuery + " ORDER BY updatedAt DESC LIMIT 20 OFFSET " + startIdx).spread((result, metadata) => {
//             result.start = startIdx;
//             result.end = startIdx + 20;
//             resolve(result);
//         });
//     }
//     catch
//     (err)
//     {
//         reject(err);
//     }
// }
// )
// ;
const getAllHistories = (userIdx, startIdx, category) => {
    return new Promise(async (resolve, reject) => {
        try {
            let inputQuery = null;
            if (category === "execute") { // 수행자
                inputQuery = "errandStatus IN ('신청진행중', '진행중', '취소완료', '완료요청중', '심부름완료') AND executorIdx = " + userIdx;
            } else if (category === "request") { // 요청자
                inputQuery = "errandStatus IN ('입금대기중', '매칭대기중', '진행중', '매칭실패', '취소완료', '완료요청중', '심부름완료') AND requesterIdx = " + userIdx;
            }

            // TODO : (DH) 가능하면 raw query 사용하지 않기
            const result = await Errands.sequelize.query("SELECT errandIdx, errandTitle, errandContent, startStationIdx, arrivalStationIdx," +
                "date_format(deadlineDt, '%m.%d') AS `deadlineDt`, itemPrice, errandPrice, errandStatus " +
                "FROM ERRANDS_TB WHERE " + inputQuery + " ORDER BY updatedAt DESC LIMIT 20 OFFSET " + startIdx).spread((result, metadata) => {
                result.start = startIdx;
                result.end = startIdx + 20;
                resolve(result);
            });
        } catch (err) {
            reject(err);
        }
    });
};

/* 6. 관심 지하철역 불러오기 */
async function loadFavoriteStations(req, res, next) {
    try {
        const token = await tokenVerify(req.headers);
        const userIdx = token.userIdx;
        const result = await getFavoriteStations(userIdx);
        let stationArr = [];
        console.log(result);
        await result.forEach(result => {
            stationArr.push(result.dataValues.stationIdx);
        });
        res.send({msg: 'success', stationIdx: stationArr});
    } catch (err) {
        next(err);
    }
}

/* 6_1  DB에서 관심 지하철역 불러오기 */
const getFavoriteStations = (userIdx) => {
    return UserStation.findAll({
        where: {userIdx: userIdx},
        attributes: ['stationIdx']
    });
};

module.exports = router;