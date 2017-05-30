/**
 * ERRANDS_TB 심부름 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const errands_tb = sequelize.define('ERRANDS_TB', {
        errandIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        requesterIdx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'USERS_TB', key: 'userIdx'}},
        executorIdx: {type: DataTypes.INTEGER, references: {model: 'USERS_TB', key: 'userIdx'}},
        errandTitle: {type: DataTypes.STRING, allowNull: false},
        errandContent: {type: DataTypes.TEXT, allowNull: false},
        startStationIdx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'STATIONS_TB', key: 'stationIdx'}},
        arrivalStationIdx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'STATIONS_TB', key: 'stationIdx'}},
        stationDistance: {type: DataTypes.INTEGER, allowNull: false},
        deadlineDt: {type: DataTypes.DATE, allowNull: false},
        itemPrice: {type: DataTypes.INTEGER, allowNull: false},
        errandPrice: {type: DataTypes.INTEGER, allowNull: false,},
        errandChatId: {type: DataTypes.STRING, allowNull: false}, // MongoDB, ERRANDSCHATS_TB의 컬럼 _id
        errandStatus: {type: DataTypes.STRING, allowNull: false,},
    }, {tableName: 'ERRANDS_TB', comment: '심부름 정보 테이블'});
    return errands_tb;
};