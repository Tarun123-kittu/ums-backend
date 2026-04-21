'use strict';

const PERMISSION_LABELS = {
    attendance: 'Attendance',
    'manage.attendance': 'Manage Attendance',
    leaves: 'Leaves',
    'manage.leaves': 'Manage Leaves',
    holidays: 'Holidays',
    'manage.holidays': 'Manage Holidays',
    'manage.employees': 'Manage Employees',
    'manage.interviews': 'Manage Interviews',
    'manage.interviews.test_series': 'Manage Interview Test Series',
    'manage.interviews.results': 'Manage Interview Results',
    'manage.role_permissions': 'Manage Role Permissions',
};

const toLabel = (permission) => {
    if (PERMISSION_LABELS[permission]) {
        return PERMISSION_LABELS[permission];
    }

    return permission
        .split(/[._]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
};

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableName = 'permissions';
        const tableDefinition = await queryInterface.describeTable(tableName);

        if (!tableDefinition.label) {
            await queryInterface.addColumn(tableName, 'label', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        const permissions = await queryInterface.sequelize.query(
            'SELECT id, permission FROM permissions',
            { type: Sequelize.QueryTypes.SELECT }
        );

        for (const permissionRecord of permissions) {
            await queryInterface.bulkUpdate(
                tableName,
                { label: toLabel(permissionRecord.permission) },
                { id: permissionRecord.id }
            );
        }

        await queryInterface.changeColumn(tableName, 'label', {
            type: Sequelize.STRING,
            allowNull: false,
        });
    },

    async down(queryInterface) {
        const tableName = 'permissions';
        const tableDefinition = await queryInterface.describeTable(tableName);

        if (tableDefinition.label) {
            await queryInterface.removeColumn(tableName, 'label');
        }
    },
};