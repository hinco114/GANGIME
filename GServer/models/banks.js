/**
 * BANKS_TB 은행 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const banks_tb = sequelize.define('BANKS_TB', {
        bank_idx : {type:DataTypes.INTEGER, autoIncrement:true, primaryKey:true},
        bank_name : {type:DataTypes.STRING(10), allowNull:false, unique:true},
        bank_image_url : {type:DataTypes.STRING, allowNull:false}
        },{timestamps:false, tableName:'BANKS_TB', comment:'은행 정보 테이블'});
    return banks_tb;
};