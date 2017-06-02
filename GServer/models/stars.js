/**
 * STARS_TB 평가 기록 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const stars_tb = sequelize.define('STARS_TB', {
        starIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userIdx: {type: DataTypes.INTEGER, allowNull: false}, //references: {model: 'USERS_TB', key: 'userIdx'}},
        errandIdx: {type: DataTypes.INTEGER, allowNull: false}, //references: {model: 'ERRANDS_TB', key: 'errandIdx'}},
        point: {type: DataTypes.INTEGER, allowNull: false}
    }, {
        timestamps: true,
        tableName: 'STARS_TB',
        comment: '평가 기록 테이블',
        classMethods: {
            associate: models => {
                models.USERS_TB.hasMany(stars_tb, {foreignKey: 'userIdx'});
                models.ERRANDS_TB.hasMany(stars_tb, {foreignKey: 'errandIdx'});
            }
        }
    });
    return stars_tb;
};