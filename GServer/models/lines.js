/**
 * LINES_TB 지하철역 호선 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const lines_tb = sequelize.define('LINES_TB', {
        line_idx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        station_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'STATIONS_TB', key: 'station_idx'}},
        line_number: {type: DataTypes.INTEGER, allowNull: false}
    }, {timestamps: false, tableName: 'LINES_TB', comment: '지하철역 호선 정보 테이블'});
    return lines_tb;
};