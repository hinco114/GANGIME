/**
 * USER_STATIONS_TB 유저의 관심 지하철역 정보 테이블
*/
module.exports = (sequelize, DataTypes) => {
    const user_stations_tb = sequelize.define('USER_STATIONS_TB', {
        user_station_idx : {type:DataTypes.INTEGER, autoIncrement:true, primaryKey:true},
        user_idx : {type:DataTypes.INTEGER, allowNull:false, references: {model: 'USERS_TB', key:'user_idx'}},
        station_idx : {type:DataTypes.INTEGER, allowNull:false, references: {model: 'STATIONS_TB', key:'station_idx'}}
    }, {timestamps:false, tableName:'USER_STATIONS_TB', comment:'유저의 관심 지하철역 정보 테이블'});
    return user_stations_tb;
};