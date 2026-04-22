const { sequelize } = require('../models');
const bcrypt = require('bcrypt')
const { successResponse, errorResponse } = require("../utils/responseHandler")
const {
    encrypt_password,
    password_compare,
    send_email,
    createToken,
    passwordResetToken } = require("../utils/commonFuntions")
const secretVariables = require('../config/config').development;



exports.createUserService = async (data, sequelize) => {
    const t = await sequelize.transaction();
    try {
        const {
            name,
            username,
            email,
            mobile,
            gender,
            dob,
            doj,
            password,
            confirm_password,
            address,
            role,
            working_schedule,
            emergency_contact_relationship,
            emergency_contact_name,
            emergency_contact,
            bank_name,
            account_number,
            ifsc,
            increment_date,
            skype_email,
            ultivic_email,
            salary,
            security,
            total_security,
            installments,
            position,
            department,
            status,
            documents,
        } = data;

        const existingUser = await sequelize.query(
            `SELECT * FROM users WHERE email = ?`,
            {
                replacements: [email],
                type: sequelize.QueryTypes.SELECT,
                transaction: t,
            }
        );

        if (existingUser.length > 0) {
            await t.rollback();
            return { success: false, message: "Email already exists." };
        }


        // ✅ NEW: ultivic_email check
        if (ultivic_email) {
            const existingUltivicEmail = await sequelize.query(
                `SELECT * FROM users WHERE ultivic_email = ?`,
                {
                    replacements: [ultivic_email],
                    type: sequelize.QueryTypes.SELECT,
                    transaction: t,
                }
            );

            if (existingUltivicEmail.length > 0) {
                await t.rollback();
                return { success: false, message: "Ultivic email already exists." };
            }
        }


        if (mobile) {
            const existingMobile = await sequelize.query(
                `SELECT * FROM users WHERE mobile = ?`,
                {
                    replacements: [mobile],
                    type: sequelize.QueryTypes.SELECT,
                    transaction: t,
                }
            );

            if (existingMobile.length > 0) {
                await t.rollback();
                return { success: false, message: "Mobile number already exists." };
            }
        }
        // ___________________

        if (confirm_password !== password) {
            await t.rollback();
            return { success: false, message: "Password and confirm password do not match." };
        }

        const hashedPassword = await encrypt_password(password);

        const fields = [
            'name', 'username', 'email', 'mobile', 'gender', 'dob', 'doj', 'password',
            'address', 'role', 'working_schedule', 'position', 'department', 'status',
            'createdAt', 'updatedAt',
        ];

        const values = [
            name, username, email, mobile, gender, dob, doj, hashedPassword,
            address, role, working_schedule, position, department, status,
            new Date(), new Date(),
        ];

        // Optional fields
        const optionalFields = [
            ['emergency_contact_relationship', emergency_contact_relationship],
            ['emergency_contact_name', emergency_contact_name],
            ['emergency_contact', emergency_contact],
            ['bank_name', bank_name],
            ['account_number', account_number],
            ['ifsc', ifsc],
            ['increment_date', increment_date],
            ['skype_email', skype_email],
            ['ultivic_email', ultivic_email],
            ['salary', salary],
            ['security', security],
            ['total_security', total_security],
            ['installments', installments],
        ];

        optionalFields.forEach(([key, value]) => {
            if (value) {
                fields.push(key);
                values.push(value);
            }
        });

        const createUserQuery = `INSERT INTO users (${fields.join(', ')}) VALUES (${values.map(() => '?').join(', ')})`;

        await sequelize.query(createUserQuery, {
            replacements: values,
            transaction: t,
        });

        const user_id = await sequelize.query(
            `SELECT LAST_INSERT_ID() AS user_id`,
            { type: sequelize.QueryTypes.SELECT, transaction: t }
        );

        const roleRecord = await sequelize.query(
            `SELECT id FROM roles WHERE role = ?`,
            { replacements: [role], type: sequelize.QueryTypes.SELECT, transaction: t }
        );

        if (roleRecord.length === 0) {
            await t.rollback();
            return { success: false, message: "Role does not exist." };
        }

        const role_id = roleRecord[0].id;

        await sequelize.query(
            `INSERT INTO user_roles (user_id, role_id,createdAt,updatedAt) VALUES (?, ?,NOW(),NOW())`,
            { replacements: [user_id[0].user_id, role_id], transaction: t }
        );

        if (documents && documents.length > 0) {
            for (const doc of documents) {
                await sequelize.query(
                    `INSERT INTO documents (user_id, document_name,createdAt,updatedAt) VALUES (?, ?,NOW(),NOW())`,
                    { replacements: [user_id[0].user_id, doc], transaction: t }
                );
            }
        }

        // Bank Leaves
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const nextYear = year + 1;

        const formattedDateTime = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}:${String(currentDate.getSeconds()).padStart(2, '0')}`;
        const session = `${year}-${nextYear}`;

        await sequelize.query(
            `INSERT INTO bank_leaves (employee_id,taken_leave,paid_leave,month_year,session,createdAt,updatedAt) VALUES(?,?,?,?,?,NOW(),NOW())`,
            { replacements: [user_id[0].user_id, 0, 1, formattedDateTime, session], transaction: t }
        );

        await t.commit();

        await send_email({
            email,
            subject: `Ums Credentials`,
            message: `Hey, your account for Ultivic has been created. Please log in with these credentials. Email: ${email} and password: ${password}`,
            template: 'user-credentials',
            locals: { name, email, password },
        });

        return { success: true, message: "User has been created successfully." };

    } catch (error) {
        await t.rollback();
        console.error("Service ERROR::", error);
        return { success: false, message: error.message };
    }
};




exports.loginService = async (email, password, sequelize) => {
    try {
        const getUserAndRolesQuery = `
      SELECT 
          u.id AS user_id, 
          u.username, 
          u.name,
          u.password, 
          p.label AS permission_label,
          u.working_schedule,
          r.role AS role_name, 
          p.permission AS permission_name,
          rp.can_view,
          rp.can_update,
          rp.can_create,
          rp.can_delete
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN roles_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = :email AND u.is_disabled = false
    `;

        const userRolesData = await sequelize.query(getUserAndRolesQuery, {
            replacements: { email },
            type: sequelize.QueryTypes.SELECT
        });

        if (!userRolesData || userRolesData.length === 0) {
            return { success: false, message: "User with this email does not exist." };
        }

        const { user_id, username, name, password: hashedPassword, working_schedule } = userRolesData[0];

        const isPasswordTrue = await password_compare(hashedPassword, password);

        if (!isPasswordTrue) {
            return { success: false, message: "Invalid Password" };
        }

        const roles = [...new Set(userRolesData.map(roleData => roleData.role_name))];

        const permissions = userRolesData.reduce((acc, roleData) => {
            const { permission_name, permission_label, can_view, can_update, can_create, can_delete } = roleData;

            acc.push({
                name: permission_name,
                label: permission_label,
                can_view,
                can_update,
                can_create,
                can_delete,
            });

            return acc;
        }, []);

        const token = await createToken(roles, user_id, username, name, email, working_schedule);

        const extraData = {
            roles
        };

        return {
            success: true,
            message: "Logged in successfully",
            data: token,
            extraData
        };

    } catch (error) {
        console.error("Service login error:", error);
        return { success: false, message: error.message };
    }
};



exports.forgotPasswordService = async (email, sequelize) => {
    try {
        const getUser = `SELECT * FROM users WHERE email = ? AND is_disabled = false`;

        const isUserExist = await sequelize.query(getUser, {
            replacements: [email],
            type: sequelize.QueryTypes.SELECT
        });

        if (isUserExist.length === 0) {
            return { success: false, message: "No user found related to this email" };
        }

        const username = isUserExist[0]?.name;

        const resetToken = await passwordResetToken();

        const update_password_reset_token = `UPDATE users SET password_reset_token = ? WHERE email = ?`;

        const [isUserUpdated] = await sequelize.query(update_password_reset_token, {
            replacements: [resetToken, email],
            type: sequelize.QueryTypes.UPDATE
        });

        if (isUserUpdated) {
            return { success: false, message: "Unable to generate the key, please try again later" };
        }

        const resetUrl = `${secretVariables.frontend_url}/reset-password/${resetToken}`;

        const message = `You can reset your password from this URL ${resetUrl}. Ignore if you don't need to reset your password.`;

        await send_email({
            email: email,
            subject: "Recovery Email",
            message,
            template: 'forgot-password',
            locals: {
                username,
                resetUrl
            },
        });

        return { success: true, message: `Email sent successfully. Please check your mail - ${email}` };

    } catch (error) {
        const resetToken = null;
        const expirationTime = null;

        await sequelize.query(`
      UPDATE users 
      SET password_reset_token = ?
      WHERE email = ?
    `, {
            replacements: [resetToken, expirationTime, email],
            type: sequelize.QueryTypes.UPDATE
        });

        console.error("Service forgot password error:", error);

        return { success: false, message: "An error occurred. Please try again later." };
    }
};



exports.resetPasswordService = async (token, password, confirm_password, sequelize) => {
    try {
        if (!token) {
            return { success: false, message: "Token is required" };
        }

        if (confirm_password !== password) {
            return { success: false, message: "Password doesn't match" };
        }

        const getTheUser = `SELECT id, password_reset_token, email FROM users WHERE password_reset_token = ?;`;

        const isUser = await sequelize.query(getTheUser, {
            replacements: [token],
            type: sequelize.QueryTypes.SELECT
        });

        if (isUser.length === 0) {
            return { success: false, message: "Invalid or expired token." };
        }

        const hashedPassword = await encrypt_password(password);
        const email = isUser[0].email;

        const update_password_query = `
         UPDATE users 
         SET password = :hashedPassword, password_reset_token = NULL 
         WHERE email = :email
         `;

        const updatePassword = await sequelize.query(update_password_query, {
            replacements: { hashedPassword, email },
            type: sequelize.QueryTypes.UPDATE
        });

        if (!updatePassword) {
            return { success: false, message: "Problem while updating the password." };
        }

        return { success: true, message: "Password updated successfully." };

    } catch (error) {
        const update_password_query = `UPDATE users SET password_reset_token = NULL WHERE email = :email`;

        await sequelize.query(update_password_query, {
            replacements: { email },
            type: sequelize.QueryTypes.UPDATE
        });

        console.error("Service reset password error:", error);

        return { success: false, message: error.message };
    }
};



exports.changePasswordService = async (userId, password, newPassword, sequelize) => {
  try {
    const GetUserQuery = `
      SELECT * FROM users WHERE id = :id AND is_disabled = false;
    `;

    const [users] = await sequelize.query(GetUserQuery, {
      replacements: { id: userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (users.length === 0) {
      return { success: false, message: 'Logged-in user not found' };
    }

    const isPassCorrect = await bcrypt.compare(password, users.password);

    if (!isPassCorrect) {
      return { success: false, message: 'Entered current password is not correct' };
    }

    const salt = await bcrypt.genSalt(10);
    const passhash = await bcrypt.hash(newPassword, salt);

    const updateQuery = `
      UPDATE users SET password = :passhash WHERE id = :id
    `;

    await sequelize.query(updateQuery, {
      replacements: { passhash, id: userId },
      type: sequelize.QueryTypes.UPDATE
    });

    return { success: true, message: 'Password changed successfully.' };

  } catch (error) {
    console.error('Service ERROR:', error);
    return { success: false, message: error.message };
  }
};



exports.getEmployeesService = async (query, sequelize) => {
  try {
    const { name, status, search } = query;

    const limit = parseInt(query.limit, 10) || 10;
    const page = parseInt(query.page, 10) || 1;
    const offset = (page - 1) * limit;

    let get_all_employee_query = `
      SELECT 
        id, name, username, email, mobile, emergency_contact_relationship, emergency_contact_name,
        emergency_contact, bank_name, account_number, ifsc, increment_date, gender, dob, doj, skype_email,
        ultivic_email, salary, security, total_security, installments, position, department, status, 
        address, role, is_disabled 
      FROM users 
      WHERE is_disabled = false
    `;

    let count_query = `
      SELECT COUNT(*) AS total 
      FROM users 
      WHERE is_disabled = false
    `;

    const replacements = {};

    // Name filter
    if (name) {
      get_all_employee_query += ` AND name LIKE :name`;
      count_query += ` AND name LIKE :name`;
      replacements.name = `%${name}%`;
    }

    // Status filter
    if (status) {
      get_all_employee_query += ` AND status = :status`;
      count_query += ` AND status = :status`;
      replacements.status = status;
    }

    //  GLOBAL SEARCH (MULTI FIELD)
    if (search) {
      get_all_employee_query += `
        AND (
          name LIKE :search OR
          email LIKE :search OR
          mobile LIKE :search OR
          ultivic_email LIKE :search OR
          department LIKE :search OR
          position LIKE :search OR
          address LIKE :search
        )
      `;

      count_query += `
        AND (
          name LIKE :search OR
          email LIKE :search OR
          mobile LIKE :search OR
          ultivic_email LIKE :search OR
          department LIKE :search OR
          position LIKE :search OR
          address LIKE :search
        )
      `;

      replacements.search = `%${search}%`;
    }

    //  Pagination
    get_all_employee_query += ` LIMIT :limit OFFSET :offset`;
    replacements.limit = limit;
    replacements.offset = offset;

    //  Total count
    const totalCountResult = await sequelize.query(count_query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    const totalEmployees = totalCountResult[0].total;
    const totalPages = Math.ceil(totalEmployees / limit);

    //  Page validation
    if (page > totalPages && totalPages !== 0) {
      return {
        success: false,
        message: `Page ${page} exceeds total number of pages (${totalPages}).`
      };
    }

    //  Fetch employees
    const employee_details = await sequelize.query(get_all_employee_query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    if (!employee_details || employee_details.length === 0) {
      return {
        success: false,
        message: "No users found matching the criteria"
      };
    }

    //  Fetch roles
    const employeeIds = employee_details.map(({ id }) => id);
    let rolesByUserId = {};

    if (employeeIds.length > 0) {
      const employeeRoles = await sequelize.query(
        `
        SELECT ur.user_id, r.id AS role_id, r.role
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.is_disabled = false
          AND r.is_disabled = false
          AND ur.user_id IN (:employeeIds)
        `,
        {
          replacements: { employeeIds },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      rolesByUserId = employeeRoles.reduce((acc, { user_id, role_id, role }) => {
        if (!acc[user_id]) acc[user_id] = [];
        acc[user_id].push({ role_id, role });
        return acc;
      }, {});
    }

    // Final data
    const employeeData = employee_details.map((employee) => ({
      ...employee,
      roles: rolesByUserId[employee.id] || [],
    }));

    // Final response
    return {
      success: true,
      message: "Fetched successfully.",
      data: employeeData,
      pagination: {
        total: totalEmployees,
        totalPages: totalPages,
        currentPage: page,
        limit: limit
      }
    };

  } catch (error) {
    console.error("Service ERROR::", error);
    return { success: false, message: error.message };
  }
};



exports.getEmployeeDetailsService = async (id, sequelize) => {
  try {
    if (!id) {
      return {
        success: false,
        message: "Employee id is required to perform this action"
      };
    }

    const get_employee_query = `
      SELECT 
        id, name, username, email, mobile, working_schedule,
        emergency_contact_relationship, emergency_contact_name,
        emergency_contact, bank_name, account_number, ifsc, increment_date,
        gender, dob, doj, skype_email, ultivic_email, salary, security,
        total_security, installments, position, department, status, 
        address, role, is_disabled 
      FROM users 
      WHERE id = ? AND is_disabled = false
    `;

    const employee_details = await sequelize.query(get_employee_query, {
      replacements: [id],
      type: sequelize.QueryTypes.SELECT
    });

    if (!employee_details || employee_details.length === 0) {
      return {
        success: false,
        message: "No User Found or User is disabled"
      };
    }

    const employeeDocuments = await sequelize.query(
      `SELECT document_name FROM documents WHERE user_id = ?`,
      {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      }
    );

    const employeeData = employee_details.map((employee) => ({
      ...employee,
      documents: employeeDocuments.map(({ document_name }) => document_name),
    }));

    return {
      success: true,
      message: "Fetched successfully.",
      data: employeeData
    };

  } catch (error) {
    console.error("Service ERROR::", error);
    return {
      success: false,
      message: error.message
    };
  }
};



exports.updateUserService = async (data, sequelize) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      id,
      name,
      username,
      email,
      mobile,
      working_schedule,
      emergency_contact_relationship,
      emergency_contact_name,
      emergency_contact,
      bank_name,
      account_number,
      ifsc,
      increment_date,
      gender,
      dob,
      doj,
      skype_email,
      ultivic_email,
      salary,
      security,
      total_security,
      installments,
      position,
      department,
      status,
      address,
      documents,
      role
    } = data;

    if (!id) {
      return { success: false, message: "ID is required for updating user" };
    }

    // ✅ Get existing user
    const [existingUser] = await sequelize.query(
      `SELECT * FROM users WHERE id = ?`,
      {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    if (!existingUser) {
      return { success: false, message: "User not found" };
    }

    // ✅ UNIQUE CHECK
    const uniqueFields = [
      { key: "email", value: email },
      { key: "ultivic_email", value: ultivic_email },
      { key: "mobile", value: mobile },
      { key: "skype_email", value: skype_email },
    ];

    for (const field of uniqueFields) {
      if (field.value !== undefined) {
        const existing = await sequelize.query(
          `SELECT id FROM users WHERE ${field.key} = ? AND id != ?`,
          {
            replacements: [field.value, id],
            type: sequelize.QueryTypes.SELECT,
            transaction,
          }
        );

        if (existing.length > 0) {
          await transaction.rollback();
          return {
            success: false,
            message: `${field.key} already exists`,
          };
        }
      }
    }

    // ✅ Dynamic update
    const fields = [];
    const values = [];

    const addField = (value, column) => {
      if (value !== undefined) {
        fields.push(`${column} = ?`);
        values.push(value === "" ? existingUser[column] : value);
      }
    };

    addField(name, "name");
    addField(username, "username");
    addField(email, "email");
    addField(mobile, "mobile");
    addField(working_schedule, "working_schedule");
    addField(emergency_contact_relationship, "emergency_contact_relationship");
    addField(emergency_contact_name, "emergency_contact_name");
    addField(emergency_contact, "emergency_contact");
    addField(bank_name, "bank_name");
    addField(account_number, "account_number");
    addField(ifsc, "ifsc");
    addField(increment_date, "increment_date");
    addField(gender, "gender");
    addField(dob, "dob");
    addField(doj, "doj");
    addField(skype_email, "skype_email");
    addField(ultivic_email, "ultivic_email");
    addField(salary, "salary");
    addField(security, "security");
    addField(total_security, "total_security");
    addField(installments, "installments");
    addField(position, "position");
    addField(department, "department");
    addField(status, "status");
    addField(address, "address");
    addField(role, "role");

    if (fields.length > 0) {
      const updateUserQuery = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

      await sequelize.query(updateUserQuery, {
        replacements: [...values, id],
        transaction,
      });
    }

    // ✅ Role update
    if (role && role !== existingUser.role) {
      const [currentRoleData] = await sequelize.query(
        `SELECT role_id FROM user_roles WHERE user_id = ? AND role_id = (SELECT id FROM roles WHERE role = ?)`,
        {
          replacements: [id, existingUser.role],
          type: sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      const [newRoleData] = await sequelize.query(
        `SELECT id FROM roles WHERE role = ?`,
        {
          replacements: [role],
          type: sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      if (currentRoleData && newRoleData) {
        await sequelize.query(
          `UPDATE user_roles SET role_id = ? WHERE user_id = ? AND role_id = ?`,
          {
            replacements: [newRoleData.id, id, currentRoleData.role_id],
            transaction,
          }
        );
      }
    }

    // ✅ Documents update
    if (Array.isArray(documents)) {
      const existingDocs = await sequelize.query(
        `SELECT document_name FROM documents WHERE user_id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      const existingDocNames = existingDocs.map(doc => doc.document_name);

      const docsToAdd = documents.filter(doc => !existingDocNames.includes(doc));
      const docsToRemove = existingDocNames.filter(doc => !documents.includes(doc));

      if (docsToAdd.length > 0) {
        const insertValues = docsToAdd.flatMap(doc => [id, doc]);

        const insertQuery = `INSERT INTO documents (user_id, document_name, createdAt, updatedAt)
          VALUES ${docsToAdd.map(() => "(?, ?, NOW(), NOW())").join(", ")}`;

        await sequelize.query(insertQuery, {
          replacements: insertValues,
          transaction,
        });
      }

      if (docsToRemove.length > 0) {
        const deleteQuery = `DELETE FROM documents WHERE user_id = ? AND document_name IN (${docsToRemove.map(() => "?").join(", ")})`;

        await sequelize.query(deleteQuery, {
          replacements: [id, ...docsToRemove],
          transaction,
        });
      }
    }

    await transaction.commit();

    return {
      success: true,
      message: "User updated successfully",
    };

  } catch (error) {
    await transaction.rollback();
    console.error("Service ERROR:", error);

    return {
      success: false,
      message: error.message,
    };
  }
};


exports.getAllUsersNameService = async (query, sequelize) => {
  try {
    const { search } = query;

    const limit = parseInt(query.limit, 10) || 10;
    const page = parseInt(query.page, 10) || 1;
    const offset = (page - 1) * limit;

    let get_users_query = `
      SELECT username, name, id, role 
      FROM users 
      WHERE is_disabled = false
    `;

    let count_query = `
      SELECT COUNT(*) AS total 
      FROM users 
      WHERE is_disabled = false
    `;

    const replacements = {};

    // 🔍 SEARCH (name + username)
    if (search) {
      get_users_query += `
        AND (
          name LIKE :search OR
          username LIKE :search
        )
      `;

      count_query += `
        AND (
          name LIKE :search OR
          username LIKE :search
        )
      `;

      replacements.search = `%${search}%`;
    }

    // ✅ Pagination
    get_users_query += ` LIMIT :limit OFFSET :offset`;
    replacements.limit = limit;
    replacements.offset = offset;

    // ✅ Count
    const totalResult = await sequelize.query(count_query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    const totalUsers = totalResult[0].total;
    const totalPages = Math.ceil(totalUsers / limit);

    if (page > totalPages && totalPages !== 0) {
      return {
        success: false,
        message: `Page ${page} exceeds total pages (${totalPages})`
      };
    }

    // ✅ Data
    const all_users = await sequelize.query(get_users_query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    if (!all_users || all_users.length === 0) {
      return {
        success: false,
        message: "No Users Found"
      };
    }

    return {
      success: true,
      message: "Fetched successfully.",
      data: all_users,
      pagination: {
        total: totalUsers,
        totalPages: totalPages,
        currentPage: page,
        limit: limit
      }
    };

  } catch (error) {
    console.error("Service ERROR:", error);
    return {
      success: false,
      message: error.message
    };
  }
};