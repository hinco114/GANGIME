/**
 * DEPOSITS_TB 입금 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const deposits_tb = sequelize.define('DEPOSITS_TB', {
        depositIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userIdx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'USERS_TB', key: 'userIdx'}},
        errandIdx: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'ERRANDS_TB', key: 'errandIdx'}},
        virtualAccount: {type: DataTypes.STRING}
    }, {tableName: 'DEPOSITS_TB', comment: '입금 정보 테이블'});
    return deposits_tb;
};
