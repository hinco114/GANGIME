/**
 * USER_STATIONS_TB 유저의 관심 지하철역 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const user_stations_tb = sequelize.define('USER_STATIONS_TB', {
        userStationIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userIdx: {type: DataTypes.INTEGER, allowNull: false}, //references: {model: 'USERS_TB', key: 'userIdx'}},
        stationIdx: {type: DataTypes.INTEGER, allowNull: false}, //references: {model: 'STATIONS_TB', key: 'stationIdx'}}
    }, {
        timestamps: true,
        tableName: 'USER_STATIONS_TB',
        comment: '유저의 관심 지하철역 정보 테이블',
        classMethods: {
            associate: models => {
                models.USERS_TB.hasMany(user_stations_tb, {foreignKey: 'userIdx'});
                models.STATIONS_TB.hasMany(user_stations_tb, {foreignKey: 'stationIdx'});
            }
        }
    });
    return user_stations_tb;
};