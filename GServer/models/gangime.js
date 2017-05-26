/* BANKS_TB 은행 정보 테이블*/
module.exports = function (Sequelize, DataTypes) {
    const banks_tb = sequelize.define('BANKS_TB', {
        bank_idx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        bank_name: {type: DataTypes.STRING, allowNull: false, unique: true}
    }, {timestamps: false, tableName: 'BANKS_TB', comment: '은행 정보 테이블'})
    return banks_tb;
}
//
// /* USERS_TB 회원 정보 테이블 */
// const users_tb = sequelize.define('USERS_TB', {
//     user_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//     user_email : {type:Sequelize.STRING, allowNull:false, unique:true},
//     user_password : {type:Sequelize.STRING, allowNull:false},
//     user_nickname : {type:Sequelize.STRING, allowNull:false, unique:true},
//     user_birthday : {type:Sequelize.DATEONLY, allowNull:false},
//     user_phone : {type:Sequelize.STRING, allowNull:false, unique:true},
//     user_account : {type:Sequelize.STRING, allowNull:false, unique:true},
//     user_bank_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: banks_tb.BANKS_TB, key:'bank_idx'}},
//     user_star_avg : {type:Sequelize.INTEGER, },
//     user_depositor : {type:Sequelize.STRING, },
//     profile_picture : {type:Sequelize.STRING, },
//     profile_thumbnail : {type:Sequelize.STRING, },
//     fcm_token : {type:Sequelize.STRING, },
//     salt : {type:Sequelize.STRING, allowNull :false}
// }, {tableName:'USERS_TB', comment:'회원 정보 테이블'})
//
// /* VERIFICATIONS_TB 이메일 인증 테이블 */
// const verifications_tb = sequelize.define('VERIFICATIONS_TB', {
//     verification_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//     email_address : {type:Sequelize.STRING, allowNull:false},
//     code : {type:Sequelize.INTEGER, allowNull:false}
// }, {timestamps:false, tableName:'VERIFICATIONS_TB', comment:'유저의 이메일 인증 번호 관리 테이블'})
//
// /* STATIONS_TB 지하철 정보 테이블*/
// const stations_tb = sequelize.define('STATIONS_TB', {
//     station_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//     station_name : {type:Sequelize.STRING, allowNull:false, unique:true},
//     station_location : {type:Sequelize.GEOMETRY, unique:true} // TYPE CHECK
// }, {timestamps:false, tableName:'STATIONS_TB', comment:'지하철역 정보 테이블'})
//
// /* LINES_TB 지하철역 호선 정보 테이블 */
// const lines_tb = sequelize.define('LINES_TB', {
//     line_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//     station_idx : {type:Sequelize.INTEGER, references: {model: stations_tb.STATIOS_TB, key:'station_idx'}},
//     line_number : {type:Sequelize.INTEGER}
// }, {timestamps:false, tableName:'LINES_TB', comment:'지하철역 호선 정보 테이블'})
//
// /* DEPOSITS_TB 입금 정보 테이블 */
// const deposits_tb = sequelize.define('DEPOSITS_TB', {
//     deposit_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//     user_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: user_tb.USERS_TB, key:'user_idx'}},
//     errand_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: errands_tb.ERRANDS_TB, key:'errand_idx'}},
//     virtual_account : {type:Sequelize.STRING}
// }, {tableName:'DEPOSITS_TB', comment:'입금 정보 테이블'})
//
//
// /* ERRANDS_TB 심부름 정보 테이블 */
// const errands_tb = sequelize.define('ERRANDS_TB', {
//     errand_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//     requester_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: user_tb.USERS_TB, key:'user_idx'}},
//     executor_idx : {type:Sequelize.INTEGER},
//     errand_title : {type:Sequelize.STRING, allowNull:false,
//         references: {model: user_tb.USERS_TB, key:'user_idx'}},
//     errand_content : {type:Sequelize.TEXT, allowNull:false},
//     start_station_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: stations_tb.STATIONS_TB, key:'station_idx'}},
//     arrival_station_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: stations_tb.STATIONS_TB, key:'station_idx'}},
//     station_distance : {type:Sequelize.INTEGER, allowNull:false},
//     deadline_dt : {type:Sequelize.DATE, allowNull:false},
//     item_price : {type:Sequelize.INTEGER, allowNull:false},
//     errand_price : {type:Sequelize.INTEGER, allowNull:false,},
//     errandchat_id : {type:Sequelize.STRING, allowNull:false},
// //        references: {model: errandschats_tb.ERRANDSCHATS_TB, key:'_id'}},  MongoDB 테이블
//     errand_status : {type:Sequelize.STRING, allowNull:false,},
//     deposit_idx : {type:Sequelize.INTEGER,
//         references: {model: deposits_tb.DEPOSITS_TB, key:'deposit_idx'}}
// }, {tableName:'ERRANDS_TB', comment:'심부름 정보 테이블'})
//
// /* NOTICES_TB 공지사항 테이블 */
// const notices_tb = sequelize.define('NOTICES_TB', {
//     notice_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//     notice_title : {type:Sequelize.STRING, allowNull:false},
//     notice_content : {type:Sequelize.STRING, allowNull:false}
// }, {timestamps:false, tableName:'NOTICES_TB', comment:'공지사항 테이블'})
//
// /* BOXES_TB 찜목록 테이블 */
// const boxes_tb = sequelize.define('BOXES_TB', {
//     box_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//     user_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: user_tb.USERS_TB, key:'user_idx'}},
//     errand_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: errands_tb.ERRANDS_TB, key:'errand_idx'}}
// }, {tableName:'BOXES_TB', comment:'찜목록 테이블'})
//
//
// /* STARS_TB 평가 기록 테이블 */
// const stars_tb = sequelize.define('STARS_TB', {
//     star_idx : {
//         type:Sequelize.INTEGER,
//         autoIncrement:true,
//         primaryKey:true
//     },
//     user_idx : {
//         type:Sequelize.INTEGER,
//         allowNull:false,
//         references: {model: users_tb.USERS_TB, key:'user_idx'}},
//     errand_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: errands_tb.ERRANDS_TB, key:'errand_idx'}},
//     point : {type:Sequelize.INTEGER, allowNull:false}
// }, {tableName:'STARS_TB', comment:'평가 기록 테이블'})
//
// /* REPORTS_TB 신고 테이블*/
// const reports_tb = sequelize.define('REPORTS_TB', {
//     report_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//     user_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: users_tb.USERS_TB, key:'user_idx'}},
//     errand_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: errands_tb.ERRANDS_TB, key:'errand_idx'}},
//     report_content : {type:Sequelize.STRING, allowNull:false}
// }, {tableName:'REPORTS_TB', comment:'신고 테이블'})
//
// /* CANCEL_TB 심부름 취소 정보 테이블 */
// const cancel_tb = sequelize.define('CANCEL_TB', {
//     cancle_idx : {type:Sequelize.INTEGER, autoIncrement:true, primaryKey:true},
//    target_user_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: users_tb.USERS_TB, key:'user_idx'}},
//     errand_idx : {type:Sequelize.INTEGER, allowNull:false,
//         references: {model: errands_tb.ERRANDS_TB, key:'errand_idx'}},
//     cancle_reason : {type:Sequelize.STRING, allowNull:false}
// }, {tableName:'CANCEL_TB', comment:'심부름 취소 정보 테이블'})
