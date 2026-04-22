'use strict';

const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User } = require('../models');

const ADMIN_USER = {
    username: 'admin',
    name: 'Admin User',
    email: 'test.ultivic@gmail.com',
    mobile: '1234567890',
    emergency_contact_name: 'admin_contact',
    emergency_contact_relationship: 'Friend',
    emergency_contact: '0987654321',
    bank_name: 'Bank Name',
    account_number: '1234567890123456',
    ifsc: 'IFSC0001234',
    increment_date: new Date('2023-09-01'),
    gender: 'male',
    dob: new Date('2000-01-01'),
    doj: new Date('2023-09-01'),
    ultivic_email: 'admin.ultivic@ultivic.com',
    salary: 50000,
    security: 10000,
    total_security: 50000,
    installments: 5,
    position: 'Co-Founder/ Chief Executive Officer',
    department: 'Management',
    status: 'Active',
    address: '123 Admin Street, Admin City, Admin State, 123456',
    role: 'Admin',
    working_schedule: 'Full Time',
    is_disabled: false,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            const hashedPassword = await bcrypt.hash('Test@123', 10);
            const adminPayload = {
                ...ADMIN_USER,
                password: hashedPassword,
            };

            // Keep the seed idempotent across reruns and environment resets.
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: ADMIN_USER.email },
                        { username: ADMIN_USER.username },
                        { ultivic_email: ADMIN_USER.ultivic_email },
                    ],
                },
            });

            if (existingUser) {
                await existingUser.update(adminPayload);
                console.log('Admin user already exists. Seed values updated successfully.');
                return;
            }

            await User.create(adminPayload);

            console.log('Admin user created successfully.');
        } catch (error) {
            console.error('Error in seeding:', error);
        }
    },

    down: async (queryInterface, Sequelize) => {
        await User.destroy({
            where: {
                [Op.or]: [
                    { email: ADMIN_USER.email },
                    { username: ADMIN_USER.username },
                    { ultivic_email: ADMIN_USER.ultivic_email },
                ],
            },
        });
    },
};
