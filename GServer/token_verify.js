/* 토큰 복호화 */
const jwt = require('jsonwebtoken');
const secretKey = 'ggmtest'; // SECRET KEY
//
// const tokenVerifier = (token) => {
//     if (token) {
//         console.log('token :', token);
//         jwt.verify(token, secretKey, (err, decoded) => {
//             // if (decoded) req.user = decoded;
//             if (decoded) return decoded;
//         });
//     }else
//         throw new Error("토큰 누락");
// }
//
// module.exports = tokenVerifier();