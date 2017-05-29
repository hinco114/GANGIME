/**
 * REPORTS_TB 신고 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const reports_tb = sequelize.define('REPORTS_TB', {
        report_idx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        user_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'USERS_TB', key: 'user_idx'}},
        errand_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'ERRANDS_TB', key: 'errand_idx'}},
        report_content: {type: DataTypes.STRING, allowNull: false}
    }, {tableName: 'REPORTS_TB', comment: '신고 테이블'});
    return reports_tb;
};