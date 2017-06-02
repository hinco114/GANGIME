/**
 * BOXES_TB 찜목록 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const boxes_tb = sequelize.define('BOXES_TB', {
        boxIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userIdx: {type: DataTypes.INTEGER, allowNull: false},
        errandIdx: {type: DataTypes.INTEGER, allowNull: false}
    }, {tableName: 'BOXES_TB', comment: '찜목록 테이블',
        classMethods:{
            associate: function(models){
            }
        }});
    return boxes_tb;
};