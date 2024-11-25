const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class LateAttendance extends Model {}

  LateAttendance.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    late_duration: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
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
    modelName: 'LateAttendance',
    tableName: 'late_attendance',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return LateAttendance;
};
