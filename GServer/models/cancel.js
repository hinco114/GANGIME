/**
 * CANCEL_TB 심부름 취소 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const cancel_tb = sequelize.define('CANCEL_TB', {
        cancle_idx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        target_user_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'USERS_TB', key: 'user_idx'}},
        errand_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'ERRANDS_TB', key: 'errand_idx'}},
        cancle_reason: {type: DataTypes.STRING, allowNull: false}
    }, {tableName: 'CANCEL_TB', comment: '심부름 취소 정보 테이블'});
    return cancel_tb;
};