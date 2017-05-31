/**
 * REPORTS_TB 신고 테이블
 */
const u_models = require('../models/').USERS_TB;
const e_models = require('../models/').ERRANDS_TB;

module.exports = (sequelize, DataTypes) => {
    const reports_tb = sequelize.define('REPORTS_TB', {
        reportIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userIdx: {type: DataTypes.INTEGER, allowNull: false},
        errandIdx: {type: DataTypes.INTEGER, allowNull: false},
        reportContent: {type: DataTypes.STRING, allowNull: false}
    }, {tableName: 'REPORTS_TB', comment: '신고 테이블',
        classMethods:{
            associate: function(u_models, e_models){
                u_models.USERS_TB.hasMany(reports_tb, {foreignKey : 'userIdx'});
                // e_models.ERRANDS_TB.hasMany(reports_tb, {foreignKey : 'errandIdx'});
            }
        }
    });
    return reports_tb;
};