/**
 * NOTICES_TB 공지사항 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const notices_tb = sequelize.define('NOTICES_TB', {
        noticeIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        noticeTitle: {type: DataTypes.STRING, allowNull: false},
        noticeContent: {type: DataTypes.TEXT, allowNull: false}
    }, {
        timestamps: true,
        tableName: 'NOTICES_TB',
        comment: '공지사항 테이블'
    });
    return notices_tb;
};