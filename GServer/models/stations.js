module.exports = (sequelize, DataTypes) => {
    const stations_tb = sequelize.define('STATIONS_TB', {
        stationIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        stationName: {type: DataTypes.STRING(20), allowNull: false, unique: true},
        stationX: {type: DataTypes.DOUBLE, allowNull: false},
        stationY: {type: DataTypes.DOUBLE, allowNull: false}
    }, {
        timestamps: false,
        tableName: 'STATIONS_TB',
        comment: '지하철역 정보 테이블'
    });
    return stations_tb;
};