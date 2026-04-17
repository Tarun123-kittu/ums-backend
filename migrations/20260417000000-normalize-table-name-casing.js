'use strict';

const TABLE_RENAMES = [
    ['Users', 'users'],
    ['Roles', 'roles'],
    ['Permissions', 'permissions'],
    ['Roles_Permissions', 'roles_permissions'],
    ['Attendances', 'attendances'],
    ['Breaks', 'breaks'],
    ['Documents', 'documents'],
    ['Languages', 'languages'],
    ['Interview_Leads', 'interview_leads'],
    ['Interviews', 'interviews'],
    ['HR_Round_Questions', 'hr_round_questions'],
    ['HR_Rounds', 'hr_rounds'],
];

const getTableNames = async (queryInterface) => {
    const tables = await queryInterface.showAllTables();

    return tables.map((table) => {
        if (typeof table === 'string') {
            return table;
        }

        return table.tableName || table.TABLE_NAME || Object.values(table)[0];
    });
};

const renameTableIfNeeded = async (queryInterface, transaction, fromTable, toTable) => {
    const tables = await getTableNames(queryInterface);

    if (!tables.includes(fromTable) || tables.includes(toTable)) {
        return;
    }

    const temporaryTable = `${toTable}__tmp__rename`;

    await queryInterface.renameTable(fromTable, temporaryTable, { transaction });
    await queryInterface.renameTable(temporaryTable, toTable, { transaction });
};

module.exports = {
    async up(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            for (const [fromTable, toTable] of TABLE_RENAMES) {
                await renameTableIfNeeded(queryInterface, transaction, fromTable, toTable);
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            for (const [fromTable, toTable] of [...TABLE_RENAMES].reverse()) {
                await renameTableIfNeeded(queryInterface, transaction, toTable, fromTable);
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },
};