/**
 * USERS_TB 회원 정보 테이블
*/
module.exports = (sequelize, DataTypes) => {
    const users_tb = sequelize.define('USERS_TB', {
        user_idx : {type:DataTypes.INTEGER, autoIncrement:true, primaryKey:true},
        user_email : {type:DataTypes.STRING, allowNull:false, unique:true},
        user_password : {type:DataTypes.STRING, allowNull:false},
        user_nickname : {type:DataTypes.STRING, allowNull:false, unique:true},
        user_birthday : {type:DataTypes.DATE, allowNull:false},
        user_phone : {type:DataTypes.STRING, allowNull:false, unique:true},
        user_account : {type:DataTypes.STRING, unique:true},
        user_bank_idx : {type:DataTypes.INTEGER, references: {model: 'BANKS_TB', key:'bank_idx'}},
        user_star_avg : {type:DataTypes.INTEGER},
        user_depositor : {type:DataTypes.STRING},
        profile_picture : {type:DataTypes.STRING},
        profile_thumbnail : {type:DataTypes.STRING},
        fcm_token : {type:DataTypes.STRING},
        salt : {type:DataTypes.STRING, allowNull :false}
    }, {tableName:'USERS_TB', comment:'회원 정보 테이블'});
    return users_tb;
};