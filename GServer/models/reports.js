/**
 * REPORTS_TB 신고 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const reports_tb = sequelize.define('REPORTS_TB', {
        reportIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userIdx: {type: DataTypes.INTEGER, allowNull: false}, //references: {model: 'USERS_TB', key: 'userIdx'}},
        errandIdx: {type: DataTypes.INTEGER, allowNull: false}, //references: {model: 'ERRANDS_TB', key: 'errandIdx'}},
        reportContent: {type: DataTypes.STRING, allowNull: false}
    }, {
        timestamps: true,
        tableName: 'REPORTS_TB',
        comment: '신고 테이블',
        classMethods: {
            associate: models => {
                models.USERS_TB.hasMany(reports_tb, {foreignKey: 'userIdx'});
                models.ERRANDS_TB.hasMany(reports_tb, {foreignKey: 'errandIdx'});
            }
        }
    });
    return reports_tb;
};