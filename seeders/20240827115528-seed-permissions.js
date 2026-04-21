'use strict';

const { Permission } = require('../models');

const permissions = [
    { permission: 'attendance', label: 'Attendance' },
    { permission: 'manage.attendance', label: 'Manage Attendance' },
    { permission: 'leaves', label: 'Leaves' },
    { permission: 'manage.leaves', label: 'Manage Leaves' },
    { permission: 'holidays', label: 'Holidays' },
    { permission: 'manage.holidays', label: 'Manage Holidays' },
    { permission: 'manage.employees', label: 'Manage Employees' },
    { permission: 'manage.interviews', label: 'Manage Interviews' },
    { permission: 'manage.interviews.test_series', label: 'Manage Interview Test Series' },
    { permission: 'manage.interviews.results', label: 'Manage Interview Results' },
    { permission: 'manage.role_permissions', label: 'Manage Role Permissions' },
];

module.exports = {
    up: async (queryInterface, Sequelize) => {
        for (const permission of permissions) {
            const [existingPermission, created] = await Permission.findOrCreate({
                where: { permission: permission.permission },
                defaults: {
                    permission: permission.permission,
                    label: permission.label,
                    is_disabled: false
                },
            });

            if (!created) {
                await existingPermission.update({
                    label: permission.label,
                });
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('permissions', null, {});
    }
};