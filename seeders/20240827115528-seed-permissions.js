'use strict';

const { Permission } = require('../models');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const permissions = [            
            { permission: 'attendance', createdAt: new Date(), updatedAt: new Date() },
            { permission: 'manage.attendance', createdAt: new Date(), updatedAt: new Date() },

            { permission: 'leaves', createdAt: new Date(), updatedAt: new Date() },
            { permission: 'manage.leaves', createdAt: new Date(), updatedAt: new Date() },

            { permission: 'holidays', createdAt: new Date(), updatedAt: new Date() },
            { permission: 'manage.holidays', createdAt: new Date(), updatedAt: new Date() },                        
            
            { permission: 'manage.employees', createdAt: new Date(), updatedAt: new Date() },

            { permission: 'manage.interviews', createdAt: new Date(), updatedAt: new Date() },
            
            { permission: 'manage.interviews.test_series', createdAt: new Date(), updatedAt: new Date() },
            
            { permission: 'manage.interviews.results', createdAt: new Date(), updatedAt: new Date() },

            { permission: 'manage.role_permissions', createdAt: new Date(), updatedAt: new Date() },
        ];

        for (const permission of permissions) {
            const [existingPermission, created] = await Permission.findOrCreate({
                where: { permission: permission.permission },
                defaults: {
                    permission: permission.permission,
                    is_disabled: false
                },
            });

            if (!created) {
                console.log(`Permission '${permission.permission}' already exists.`);
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('permissions', null, {});
    }
};