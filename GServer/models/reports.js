/**
 * REPORTS_TB 신고 테이블
 */
const models = require('../models/');

module.exports = (sequelize, DataTypes) => {
    const reports_tb = sequelize.define('REPORTS_TB', {
        reportIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userIdx: {type: DataTypes.INTEGER, allowNull: false},
        errandIdx: {type: DataTypes.INTEGER, allowNull: false},
        reportContent: {type: DataTypes.STRING, allowNull: false}
    }, {tableName: 'REPORTS_TB', comment: '신고 테이블',
        classMethods:{
            associate: function(models){
                models.USERS_TB.hasMany(reports_tb, {foreignKey : 'userIdx'});
                models.ERRANDS_TB.hasMany(reports_tb, {foreignKey : 'errandIdx'});
            }
        }
    });
    return reports_tb;
};