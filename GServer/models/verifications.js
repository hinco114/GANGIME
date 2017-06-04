/**
 * VERIFICATIONS_TB 이메일 인증 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const verifications_tb = sequelize.define('VERIFICATIONS_TB', {
        verificationIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userEmail: {type: DataTypes.STRING, allowNull: false, validate: {isEmail: true}},
        code: {type: DataTypes.INTEGER, allowNull: false}
    }, {
        timestamps: false,
        tableName: 'VERIFICATIONS_TB',
        comment: '유저의 이메일 인증 번호 관리 테이블'
    });
    return verifications_tb;
};