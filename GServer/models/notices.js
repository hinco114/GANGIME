/**
 * NOTICES_TB 공지사항 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const notices_tb = sequelize.define('NOTICES_TB', {
        notice_idx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        notice_title: {type: DataTypes.STRING, allowNull: false},
        notice_content: {type: DataTypes.TEXT, allowNull: false}
    }, {tableName: 'NOTICES_TB', comment: '공지사항 테이블'});
    return notices_tb;
};