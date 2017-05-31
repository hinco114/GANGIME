/* V*/
const jwt = require('jsonwebtoken');
// const jwtConfig = require('../config/config.json')['jwt'];
//
// const tokenVerifier = (token) => {
//     if (token) {
//         console.log('token :', token);
//         jwt.verify(token, jwtConfig.SECRET_KEY, (err, decoded) => {
//             // if (decoded) req.user = decoded;
//             if (decoded) return decoded;
//         });
//     }else
//         throw new Error("토큰 누락");
// }
//
// module.exports = tokenVerifier();