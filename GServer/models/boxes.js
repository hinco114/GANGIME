/**
 * BOXES_TB 찜목록 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const boxes_tb = sequelize.define('BOXES_TB', {
        boxIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userIdx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'USERS_TB', key: 'userIdx'}},
        errandIdx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'ERRANDS_TB', key: 'errandIdx'}}
    }, {tableName: 'BOXES_TB', comment: '찜목록 테이블'});
    return boxes_tb;
};