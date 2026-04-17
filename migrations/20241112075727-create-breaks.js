'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Breaks', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            attendance_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            break_start: {
                type: Sequelize.TIME,
                allowNull: true,
            },
            break_end: {
                type: Sequelize.TIME,
                allowNull: true,
            },
            break_totaltime: {
                type: Sequelize.TIME,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Breaks');
    }
};
