/**
 * BOXES_TB 찜목록 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const boxes_tb = sequelize.define('BOXES_TB', {
        box_idx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        user_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'USERS_TB', key: 'user_idx'}},
        errand_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'ERRANDS_TB', key: 'errand_idx'}}
    }, {tableName: 'BOXES_TB', comment: '찜목록 테이블'});
    return boxes_tb;
};