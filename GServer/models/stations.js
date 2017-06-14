module.exports = (sequelize, DataTypes) => {
    const stations_tb = sequelize.define('STATIONS_TB', {
        stationIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        stationName: {type: DataTypes.STRING(20), allowNull: false, unique: true},
        stationLines: {type: DataTypes.STRING, allowNull: false},
        stationLocation: {type: DataTypes.GEOMETRY('POINT'), allowNull: false}
    }, {
        timestamps: false,
        tableName: 'STATIONS_TB',
        comment: '지하철역 정보 테이블',
        classMethods: {
            associate: models => {
                models.ERRANDS_TB.belongsTo(stations_tb, {foreignKey: 'startStationIdx'});
                models.ERRANDS_TB.belongsTo(stations_tb, {foreignKey: 'arrivalStationIdx'});
            }
        }
    });
    return stations_tb;
};