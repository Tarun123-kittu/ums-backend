'use strict';

const { Role } = require('../models');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const roles = [
            { role: 'Admin', createdAt: new Date(), updatedAt: new Date() },
        ];

        for (const role of roles) {
            const [existingRole, created] = await Role.findOrCreate({
                where: { role: role.role },
                defaults: {
                    role: role.role,
                    is_disabled: false
                },
            });
            if (!created) {
                console.log(`Role '${role.role}' already exists.`);
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('roles', null, {});
    }
};