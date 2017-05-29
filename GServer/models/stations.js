module.exports = (sequelize, DataTypes) => {
    const stations_tb = sequelize.define('STATIONS_TB', {
        station_idx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        station_name: {type: DataTypes.STRING(20), allowNull: false, unique: true},
        station_x: {type: DataTypes.DOUBLE, allowNull: false},
        station_y: {type: DataTypes.DOUBLE, allowNull: false}
    }, {timestamps: false, tableName: 'STATIONS_TB', comment: '지하철역 정보 테이블'});
    return stations_tb;
};