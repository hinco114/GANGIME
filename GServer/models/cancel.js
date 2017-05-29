/**
 * CANCEL_TB 심부름 취소 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const cancel_tb = sequelize.define('CANCEL_TB', {
        cancelIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        targetUserIdx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'USERS_TB', key: 'userIdx'}},
        errandIdx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'ERRANDS_TB', key: 'errandIdx'}},
        cancelReason: {type: DataTypes.STRING, allowNull: false}
    }, {tableName: 'CANCEL_TB', comment: '심부름 취소 정보 테이블'});
    return cancel_tb;
};