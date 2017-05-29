/**
 * STARS_TB 평가 기록 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const stars_tb = sequelize.define('STARS_TB', {
        star_idx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        user_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'USERS_TB', key: 'user_idx'}},
        errand_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'ERRANDS_TB', key: 'errand_idx'}},
        point: {type: DataTypes.INTEGER, allowNull: false}
    }, {tableName: 'STARS_TB', comment: '평가 기록 테이블'});
    return stars_tb;
}