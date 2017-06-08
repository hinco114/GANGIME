/**
 * ERRANDS_TB 심부름 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const errands_tb = sequelize.define('ERRANDS_TB', {
        errandIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        requesterIdx: {type: DataTypes.INTEGER, allowNull: false}, //references: {model: 'USERS_TB', key: 'requesterIdx'}},
        executorIdx: {type: DataTypes.INTEGER}, //references: {model: 'USERS_TB', key: 'executorIdx'}},
        errandTitle: {type: DataTypes.STRING, allowNull: false},
        errandContent: {type: DataTypes.TEXT, allowNull: false},
        startStationIdx: {type: DataTypes.INTEGER, allowNull: false}, //references: {model: 'STATIONS_TB', key: 'startStationIdx'}},
        arrivalStationIdx: {type: DataTypes.INTEGER, allowNull: false}, //references: {model: 'STATIONS_TB', key: 'arrivalStationIdx'}},
        stationDistance: {type: DataTypes.INTEGER, allowNull: false},
        deadlineDt: {type: DataTypes.DATE, allowNull: false},
        itemPrice: {type: DataTypes.INTEGER, allowNull: false},
        errandPrice: {type: DataTypes.INTEGER, allowNull: false,},
        errandChatId: {type: DataTypes.STRING}, // MongoDB, ERRANDSCHATS_TB의 컬럼 _id
        errandStatus: {type: DataTypes.STRING, allowNull: false,},
    }, {
        timestamps: true,
        tableName: 'ERRANDS_TB',
        comment: '심부름 정보 테이블',
        classMethods: {
            associate: models => {
                models.USERS_TB.hasMany(errands_tb, {foreignKey: 'requesterIdx'});
                models.USERS_TB.hasMany(errands_tb, {foreignKey: 'executorIdx'});
                models.STATIONS_TB.hasMany(errands_tb, {foreignKey: 'startStationIdx'});
                models.STATIONS_TB.hasMany(errands_tb, {foreignKey: 'arrivalStationIdx'});
                models.BOXES_TB.belongsTo(errands_tb, {foreignKey: 'errandIdx'});
            }
        }
    });
    return errands_tb;
};