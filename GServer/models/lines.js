/**
 * LINES_TB 지하철역 호선 정보 테이블
 */
const s_models = require('../models/').STATIONS_TB;

module.exports = (sequelize, DataTypes) => {
    const lines_tb = sequelize.define('LINES_TB', {
        lineIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        stationIdx: {type: DataTypes.INTEGER, allowNull: false},
        lineNumber: {type: DataTypes.INTEGER, allowNull: false}
    },  {timestamps: false, tableName: 'LINES_TB',
        comment: '지하철역 호선 정보 테이블',
        classMethods:{
            associate: function(s_models){
                s_models.STATIONS_TB.hasMany(lines_tb, {foreignKey : 'stationIdx', targetKey : 'stationIdx' });
            }
        }
    });
    return lines_tb;
};