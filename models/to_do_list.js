const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ToDoList extends Model { }

    ToDoList.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        task_name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        task_status: {
            type: DataTypes.ENUM('COMPLETED', 'ACTIVE'),
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'ToDoList',
        tableName: 'to_do_list',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    return ToDoList;
};
