/**
 * ERRANDS_TB 심부름 정보 테이블
*/
module.exports = (sequelize, DataTypes) => {
    const errands_tb = sequelize.define('ERRANDS_TB', {
        errand_idx : {type:DataTypes.INTEGER, autoIncrement:true, primaryKey:true},
        requester_idx : {type:DataTypes.INTEGER, allowNull:false, references: {model: 'USERS_TB', key:'user_idx'}},
        executor_idx : {type:DataTypes.INTEGER, references: {model: 'USERS_TB', key:'user_idx'}},
        errand_title : {type:DataTypes.STRING, allowNull:false},
        errand_content : {type:DataTypes.TEXT, allowNull:false},
        start_station_idx : {type:DataTypes.INTEGER, allowNull:false, references: {model: 'STATIONS_TB', key:'station_idx'}},
        arrival_station_idx : {type:DataTypes.INTEGER, allowNull:false, references: {model: 'STATIONS_TB', key:'station_idx'}},
        station_distance : {type:DataTypes.INTEGER, allowNull:false},
        deadline_dt : {type:DataTypes.DATE, allowNull:false},
        item_price : {type:DataTypes.INTEGER, allowNull:false},
        errand_price : {type:DataTypes.INTEGER, allowNull:false,},
        errandchat_id : {type:DataTypes.STRING, allowNull:false}, // MongoDB, ERRANDSCHATS_TB의 컬럼 _id
        errand_status : {type:DataTypes.STRING, allowNull:false,},
        // deposit_idx : {type:DataTypes.INTEGER, references: {model: 'DEPOSITS_TB', key:'deposit_idx'}}
    }, {tableName:'ERRANDS_TB', comment:'심부름 정보 테이블'});
    return errands_tb;
};