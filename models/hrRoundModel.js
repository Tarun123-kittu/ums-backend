const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class HRRound extends Model { }

    HRRound.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            interview_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'interviews',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            lead_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'interview_leads',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            questionid: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'hr_round_questions',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            answer: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            key_point: {
                type: DataTypes.STRING(1000),
                allowNull: true,
            },
            auth_token: {
                type: DataTypes.STRING(500),
                allowNull: false,
            },
            is_open: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: 'HRRound',
            tableName: 'hr_rounds',
            timestamps: true,
        }
    );

    return HRRound;
};
