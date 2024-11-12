const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Breaks extends Model {}

  Breaks.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    attendance_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    break_start: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    break_end: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    break_totaltime: {
      type: DataTypes.TIME,
      allowNull: true,
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
    modelName: 'Break',
    tableName: 'breaks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Breaks;
};
