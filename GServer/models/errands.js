/**
 * ERRANDS_TB 심부름 정보 테이블
 */
const models = require('../models/');

module.exports = (sequelize, DataTypes) => {
    const errands_tb = sequelize.define('ERRANDS_TB', {
        errandIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        requesterIdx: {type: DataTypes.INTEGER, allowNull: false},
        executorIdx: {type: DataTypes.INTEGER},
        errandTitle: {type: DataTypes.STRING, allowNull: false},
        errandContent: {type: DataTypes.TEXT, allowNull: false},
        startStationIdx: {type: DataTypes.INTEGER, allowNull: false},
        arrivalStationIdx: {type: DataTypes.INTEGER, allowNull: false},
        stationDistance: {type: DataTypes.INTEGER, allowNull: false},
        deadlineDt: {type: DataTypes.DATE, allowNull: false},
        itemPrice: {type: DataTypes.INTEGER, allowNull: false},
        errandPrice: {type: DataTypes.INTEGER, allowNull: false,},
        errandChatId: {type: DataTypes.STRING, allowNull: false}, // MongoDB, ERRANDSCHATS_TB의 컬럼 _id
        errandStatus: {type: DataTypes.STRING, allowNull: false,},
    }, {
        tableName: 'ERRANDS_TB', comment: '심부름 정보 테이블',
        classMethods: {
            // associate: function (u_models) {
            //     errands_tb.hasMany(u_models.USERS_TB, {foreignKey: 'userIdx', targetKey: 'requesterIdx'});
            //     errands_tb.hasMany(u_models.USERS_TB, {foreignKey: 'userIdx', targetKey: 'executorIdx'});
            // },
            // function (s_models){
            //     errands_tb.hasMany(s_models.STATIONS_TB, {
            //         foreignKey: 'stationIdx',
            //         targetKey: 'startStationIdx'
            //     });
            //     errands_tb.hasMany(s_models.STATIONS_TB, {
            //         foreignKey: 'stationIdx',
            //         targetKey: 'arrivalStationIdx'
    //     });
    // }
    associate: function (models) {
        errands_tb.hasMany(models.USERS_TB, {foreignKey: 'userIdx', targetKey: 'requesterIdx'});
        errands_tb.hasMany(models.USERS_TB, {foreignKey: 'userIdx', targetKey: 'executorIdx'});
        errands_tb.hasMany(models.STATIONS_TB, {foreignKey: 'stationIdx', targetKey: 'startStationIdx'});
        errands_tb.hasMany(models.STATIONS_TB, {foreignKey: 'stationIdx', targetKey: 'arrivalStationIdx'});
    }
}
});
    return errands_tb;
};