/**
 * DEPOSITS_TB 입금 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const deposits_tb = sequelize.define('DEPOSITS_TB', {
        deposit_idx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        user_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'USERS_TB', key: 'user_idx'}},
        errand_idx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'ERRANDS_TB', key: 'errand_idx'}},
        virtual_account: {type: DataTypes.STRING}
    }, {tableName: 'DEPOSITS_TB', comment: '입금 정보 테이블'});
    return deposits_tb;
};
