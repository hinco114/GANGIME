/**
 * USERS_TB 회원 정보 테이블
 */
module.exports = (sequelize, DataTypes) => {
    const users_tb = sequelize.define('USERS_TB', {
        userIdx: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        userEmail: {type: DataTypes.STRING(100), allowNull: false, unique: true, validate: {isEmail: true}},
        userPassword: {type: DataTypes.STRING, allowNull: false},
        userNickname: {type: DataTypes.STRING(10), allowNull: false, unique: true},
        userBirthday: {type: DataTypes.DATEONLY, allowNull: false},
        userPhone: {type: DataTypes.STRING(15), allowNull: false, unique: true},
        userBankIdx: {type: DataTypes.INTEGER}, //references: {model: 'BANKS_TB', key: 'userBankIdx'}},
        userAccount: {type: DataTypes.STRING(30)},
        userStarAvg: {type: DataTypes.INTEGER},
        userDepositor: {type: DataTypes.STRING},
        profilePicture: {type: DataTypes.STRING, isUrl: true},
        profileThumbnail: {type: DataTypes.STRING, isUrl: true},
        fcmToken: {type: DataTypes.STRING},
    }, {
        timestamps: true,
        tableName: 'USERS_TB',
        comment: '회원 정보 테이블',
        classMethods: {
            associate: models => {
                models.BANKS_TB.hasOne(users_tb, {foreignKey: 'userBankIdx'});
                models.BOXES_TB.belongsTo(users_tb, {foreignKey: 'userIdx'});
            }
        }
    });
    return users_tb;
};