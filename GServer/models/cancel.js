/**
 * CANCEL_TB 심부름 취소 정보 테이블
 */
const models = require('../models/');

module.exports = (sequelize, DataTypes) => {
    const cancel_tb = sequelize.define('CANCEL_TB', {
        cancelIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        targetUserIdx: {type: DataTypes.INTEGER, allowNull: false},
        errandIdx: {type: DataTypes.INTEGER, allowNull: false},
        cancelReason: {type: DataTypes.STRING, allowNull: false}
    }, {
        tableName: 'CANCEL_TB', comment: '심부름 취소 정보 테이블',
        classMethods: {
            associate: function (models) {
                models.USERS_TB.hasMany(cancel_tb, {foreignKey: 'targetUserIdx', targetKey: 'userIdx'});
                models.ERRANDS_TB.hasOne(cancel_tb, {foreignKey: 'errandIdx', targetKey: 'errandIdx'});
            }
        }
    });
    return cancel_tb;
};