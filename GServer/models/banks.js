/**
 * BANKS_TB 은행 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const banks_tb = sequelize.define('BANKS_TB', {
        bankIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        bankName: {type: DataTypes.STRING(10), allowNull: false, unique: true},
        bankImageUrl: {type: DataTypes.STRING, allowNull: false, validate: {isUrl: true}}
    }, {
        timestamps: false,
        tableName: 'BANKS_TB',
        comment: '은행 정보 테이블'
    });
    return banks_tb;
};