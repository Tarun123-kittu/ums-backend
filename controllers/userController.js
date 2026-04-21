const { sequelize } = require('../models');
const bcrypt = require('bcrypt')
const { successResponse, errorResponse } = require("../utils/responseHandler")
const {
  encrypt_password,
  password_compare,
  send_email,
  createToken,
  passwordResetToken,
  isTokenExpired } = require("../utils/commonFuntions")





exports.create_user = async (req, res) => {
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
    } = req.body;




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
      return res.status(400).json({ message: "Email already exists." });
    }


    if (confirm_password !== password) {
      await t.rollback();
      return res.status(400).json({ message: "Password and confirm password do not match." });
    }


    const hashedPassword = await encrypt_password(password);


    const fields = [
      'name',
      'username',
      'email',
      'mobile',
      'gender',
      'dob',
      'doj',
      'password',
      'address',
      'role',
      'working_schedule',
      'position',
      'department',
      'status',
      'createdAt',
      'updatedAt',
    ];

    const values = [
      name,
      username,
      email,
      mobile,
      gender,
      dob,
      doj,
      hashedPassword,
      address,
      role,
      working_schedule,
      position,
      department,
      status,
      new Date(),
      new Date(),
    ];


    if (emergency_contact_relationship) {
      fields.push('emergency_contact_relationship');
      values.push(emergency_contact_relationship);
    }

    if (emergency_contact_name) {
      fields.push('emergency_contact_name');
      values.push(emergency_contact_name);
    }

    if (emergency_contact) {
      fields.push('emergency_contact');
      values.push(emergency_contact);
    }

    if (bank_name) {
      fields.push('bank_name');
      values.push(bank_name);
    }

    if (account_number) {
      fields.push('account_number');
      values.push(account_number);
    }

    if (ifsc) {
      fields.push('ifsc');
      values.push(ifsc);
    }

    if (increment_date) {
      fields.push('increment_date');
      values.push(increment_date);
    }

    if (skype_email) {
      fields.push('skype_email');
      values.push(skype_email);
    }

    if (ultivic_email) {
      fields.push('ultivic_email');
      values.push(ultivic_email);
    }

    if (salary) {
      fields.push('salary');
      values.push(salary);
    }

    if (security) {
      fields.push('security');
      values.push(security);
    }

    if (total_security) {
      fields.push('total_security');
      values.push(total_security);
    }

    if (installments) {
      fields.push('installments');
      values.push(installments);
    }


    const createUserQuery = `
            INSERT INTO users (${fields.join(', ')}) VALUES (${values.map(() => '?').join(', ')})
        `;





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
      return res.status(400).json({ message: "Role does not exist." });
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

const currentDate = new Date();

const year = currentDate.getFullYear();
const nextYear = currentDate.getFullYear() + 1;
const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); 
const day = currentDate.getDate().toString().padStart(2, '0');
const hours = currentDate.getHours().toString().padStart(2, '0');
const minutes = currentDate.getMinutes().toString().padStart(2, '0');
const seconds = currentDate.getSeconds().toString().padStart(2, '0');

const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
const session = year+"-"+nextYear

    await sequelize.query(
      `INSERT INTO bank_leaves (employee_id,taken_leave,paid_leave,month_year,session,createdAt,updatedAt) VALUES(?,?,?,?,?,NOW(),NOW())`,
      {replacements : [user_id[0].user_id,0,1,formattedDateTime,session]}
    )

    await t.commit();


    await send_email({
      email: email,
      subject: `Ums Credentials`,
      message: `Hey, your account for Ultivic has been created. Please log in with these credentials. Email: ${email} and password: ${password}`,
      template: 'user-credentials',
      locals: {
        name,
        email,
        password,
      },
    });

    return res.status(201).json({ message: "User has been created successfully." });
  } catch (error) {
    await t.rollback();
    console.error("ERROR::", error);
    return res.status(500).json(errorResponse(error.message));
  }
};









exports.login = async (req, res) => {
  const { email, password } = req.body;

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
  FROM 
      users u
  LEFT JOIN 
      user_roles ur ON u.id = ur.user_id
  LEFT JOIN 
      roles r ON ur.role_id = r.id
  LEFT JOIN 
      roles_permissions rp ON r.id = rp.role_id
  LEFT JOIN 
      permissions p ON rp.permission_id = p.id
  WHERE 
      u.email = :email AND u.is_disabled = false
`;

  try {
    const userRolesData = await sequelize.query(getUserAndRolesQuery, {
      replacements: { email },
      type: sequelize.QueryTypes.SELECT
    });

    if (!userRolesData || userRolesData.length === 0) { return res.status(400).json({ message: "User with this email does not exist.", type: 'error' }); }
    
    const { user_id, username,name, password: hashedPassword,working_schedule } = userRolesData[0];
    

    const isPasswordTrue = await password_compare(hashedPassword, password);

    if (!isPasswordTrue) { return res.status(401).json({ type: "error", message: "Invalid Password" }); }


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
   
    const token = await createToken(roles, user_id, username,name, email,working_schedule);

    return res.status(200).json({
      type: "success",
      message: "Logged in successfully",
      token,
      roles,
      id: user_id,
    });

  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json(errorResponse(error.message));
  }
};





exports.forgot_password = async (req, res) => {

  const { email } = req.body;
  const getUser = `SELECT * FROM users WHERE email = ? AND is_disabled = false`;

  try {
    const isUserExist = await sequelize.query(getUser, {
      replacements: [email],
      type: sequelize.QueryTypes.SELECT
    });

    if (isUserExist.length === 0) { return res.status(404).json(errorResponse("No user found related to this email")); }
    console.log(isUserExist)
    const username = isUserExist[0]?.name
    const resetToken = await passwordResetToken();

    const update_password_reset_token = 'UPDATE users SET password_reset_token = ? WHERE email = ?';
    const [isUserUpdated] = await sequelize.query(update_password_reset_token, {
      replacements: [resetToken, email],
      type: sequelize.QueryTypes.UPDATE
    });

    if (isUserUpdated) { return res.status(400).json(errorResponse("Unable to generate the key, please try again later")); }

    const resetUrl = `${process.env.FRONTEND_URL}/reset_password/${resetToken}`;
    const message = `You can reset your password from this URL ${resetUrl}. Ignore if you don't need to reset your password.`;

    await send_email({
      email: email,
      subject: "Recovery Email",
      message,
      template: 'forgot-password',
      locals: {
        username,
        resetUrl,
      },
    });

    res.status(200).json(successResponse("Email sent successfully"));

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
    res.status(500).json({ type: "error", message: "An error occurred. Please try again later." });
  }
};

exports.reset_password = async (req, res, next) => {

  try {
    const hashed_token = req.params.token;
    if (!hashed_token) return res.status(400).json({ type: "error", message: "Token is required" })
    const { password, confirm_password } = req.body;

    if (confirm_password !== password) { return res.status(400).json({ type: "error", message: "Password doesn't match" }); }

    const getTheUser = `SELECT id, password_reset_token, email FROM users WHERE password_reset_token = ?;`;

    const isUser = await sequelize.query(getTheUser, {
      replacements: [hashed_token],
      type: sequelize.QueryTypes.SELECT
    });

    if (isUser.length === 0) { return res.status(400).json(errorResponse("Invalid or expired token.")); }

    const hashedPassword = await encrypt_password(password);
    const email = isUser[0].email;

    const update_password_query = `UPDATE users SET password = :hashedPassword WHERE email = :email`;
    const updatePassword = await sequelize.query(update_password_query, {
      replacements: { hashedPassword, email },
      type: sequelize.QueryTypes.UPDATE
    });
    if (!updatePassword) return res.status(400).json(errorResponse("Problem while updating the password."))

    res.status(200).json(successResponse("Password updated successfully."));
  } catch (error) {
    const update_password_query = `UPDATE users SET password_reset_token = NULL WHERE email = :email`;
    const updatePassword = await sequelize.query(update_password_query, {
      replacements: { email },
      type: sequelize.QueryTypes.UPDATE
    });
    res.status(500).json(errorResponse(error.message));
  }
};





exports.change_password = async (req, res) => {
  try {
    const id = req.result.user_id;
    const { password, newPassword } = req.body;

    const GetUserQuery = `
  SELECT * FROM users WHERE id = :id AND is_disabled = false;
  `;
    const [users] = await sequelize.query(GetUserQuery, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });

    if (users.length === 0) { return res.status(400).json(errorResponse('Logged-in user not found')) }

    const isPassCorrect = await bcrypt.compare(password, users.password);
    if (!isPassCorrect) { return res.status(400).json(errorResponse('Entered current password is not correct')); }

    const salt = await bcrypt.genSalt(10);
    const passhash = await bcrypt.hash(newPassword, salt);

    const updateQuery = `
  UPDATE users SET password = :passhash WHERE id = :id`;
    await sequelize.query(updateQuery, {
      replacements: { passhash, id },
      type: sequelize.QueryTypes.UPDATE
    });

    return res.status(200).json(successResponse('Password changed successfully.'));
  } catch (error) {
    console.error('ERROR', error);
    return res.status(500).json(errorResponse(error.message));
  }
}



exports.get_employee_details = async(req,res)=>{
  const id = req.query.id;
  if (!id) return res.status(400).json({ type: "error", message: "Employee id is required to perform this action" });
  try {
    const get_employee_query = `
      SELECT 
        id, name, username, email, mobile,working_schedule, emergency_contact_relationship, emergency_contact_name,
        emergency_contact, bank_name, account_number, ifsc, increment_date, gender, dob, doj, skype_email,
        ultivic_email, salary, security, total_security, installments, position, department, status, 
        address, role, is_disabled 
      FROM 
        users 
      WHERE 
        id = ? AND is_disabled = false
    `;

    const employee_details = await sequelize.query(get_employee_query, {
      replacements: [id],
      type: sequelize.QueryTypes.SELECT
    });

    const employeeDocuments = await sequelize.query(
      `SELECT document_name FROM documents WHERE user_id = ?`,
      {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!employee_details || employee_details.length === 0) {
      return res.status(400).json({
        type: "error",
        message: "No User Found or User is disabled"
      });
    }

    const employeeData = employee_details.map((employee) => ({
      ...employee,
      documents: employeeDocuments.map(({ document_name }) => document_name),
    }));

    return res.status(200).json({
      type: "success",
      data: employeeData,
    });
  } catch (error) {
    return res.status(400).json({
      type: "error",
      message: error?.message
    });
  }
}



exports.get_employees = async (req, res) => {
  const { name, status, limit = 10, page } = req.query;

  try {

    let get_all_employee_query = `
      SELECT 
        id, name, username, email, mobile, emergency_contact_relationship, emergency_contact_name,
        emergency_contact, bank_name, account_number, ifsc, increment_date, gender, dob, doj, skype_email,
        ultivic_email, salary, security, total_security, installments, position, department, status, 
        address, role, is_disabled 
      FROM 
        users 
      WHERE is_disabled = false
    `;


    let count_query = `
      SELECT COUNT(*) AS total 
      FROM users 
      WHERE is_disabled = false
    `;

    const replacements = {};


    if (name) {
      get_all_employee_query += ` AND name LIKE :name`;
      count_query += ` AND name LIKE :name`;
      replacements.name = `%${name}%`;
    }

    if (status) {
      get_all_employee_query += ` AND status = :status`;
      count_query += ` AND status = :status`;
      replacements.status = status;
    }


    const offset = (page - 1) * limit;
    get_all_employee_query += ` LIMIT :limit OFFSET :offset`;


    replacements.limit = parseInt(limit, 10);
    replacements.offset = parseInt(offset, 10);


    const totalCountResult = await sequelize.query(count_query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    const totalEmployees = totalCountResult[0].total;


    const totalPages = Math.ceil(totalEmployees / limit);


    const employee_details = await sequelize.query(get_all_employee_query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    if (!employee_details || employee_details.length === 0) {
      return res.status(400).json({
        type: "error",
        message: "No users found matching the criteria",
      });
    }


    if (page > totalPages) {
      return res.status(400).json({
        type: "error",
        message: `Page ${page} exceeds total number of pages (${totalPages}).`
      });
    }

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
        if (!acc[user_id]) {
          acc[user_id] = [];
        }

        acc[user_id].push({ role_id, role });
        return acc;
      }, {});
    }

    const employeeData = employee_details.map((employee) => ({
      ...employee,
      roles: rolesByUserId[employee.id] || [],
    }));


    return res.status(200).json({
      type: "success",
      data: employeeData,
      total_pages: totalPages,
      current_page: parseInt(page, 10),
      total_employees: totalEmployees,
      limit: parseInt(limit, 10),
    });
  } catch (error) {
    console.log('ERROR::', error)
    return res.status(500).json(errorResponse(error.message))
  }
};







exports.delete_employee = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ type: "error", message: "Employee id is required to perform this action" });
  try {
    const employee_delete_query = `UPDATE users SET is_disabled = true WHERE id = ?`;
    const is_user_deleted = await sequelize.query(employee_delete_query, {
      replacements: [id],
      type: sequelize.QueryTypes.UPDATE
    });

    if (!is_user_deleted) return res.status(400).json({ type: "error", message: "Error while deleting the employee" })
    return res.status(200).json({
      type: "success",
      message: "Employee deleted successfully !!"
    })
  } catch (error) {
    return res.status(400).json({
      type: "error",
      message: error?.message,
    });
  }
}





exports.update_user = async (req, res) => {
  const {
    id, name, username, email, mobile, emergency_contact_relationship, emergency_contact_name,working_schedule,
    emergency_contact, bank_name, account_number, ifsc, increment_date, gender, dob, doj, skype_email,
    ultivic_email, salary, security, total_security, installments, position, department, status,
    address, documents, role
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID is required for updating user" });
  }

  const transaction = await sequelize.transaction();

  try {
  
    const [existingUser] = await sequelize.query(`SELECT * FROM users WHERE id = ?`, {
      replacements: [id],
      type: sequelize.QueryTypes.SELECT,
      transaction,
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

  
    const requiredFields = ['name', 'username', 'email', 'mobile', 'gender', 'dob', 'doj', 'position', 'department', 'status', 'address','working_schedule'];
    const missingFields = requiredFields.filter(field => req.body[field] === undefined);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }


    const fields = [];
    const values = [];
    const addField = (value, column) => {
      if (value !== undefined) {
        fields.push(`${column} = ?`);
        values.push(value === "" ? null : value);
      }
    };

    addField(name, 'name');
    addField(username, 'username');
    addField(email, 'email');
    addField(mobile, 'mobile');
    addField(working_schedule,'working_schedule');
    addField(emergency_contact_relationship, 'emergency_contact_relationship');
    addField(emergency_contact_name, 'emergency_contact_name');
    addField(emergency_contact, 'emergency_contact');
    addField(bank_name, 'bank_name');
    addField(account_number, 'account_number');
    addField(ifsc, 'ifsc');
    addField(increment_date, 'increment_date');
    addField(gender, 'gender');
    addField(dob, 'dob');
    addField(doj, 'doj');
    addField(skype_email, 'skype_email');
    addField(ultivic_email, 'ultivic_email');
    addField(salary, 'salary');
    addField(security, 'security');
    addField(total_security, 'total_security');
    addField(installments, 'installments');
    addField(position, 'position');
    addField(department, 'department');
    addField(status, 'status');
    addField(address, 'address');
    addField(role, 'role');

   
    if (fields.length > 0) {
      const updateUserQuery = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      await sequelize.query(updateUserQuery, {
        replacements: [...values, id],
        transaction,
      });
    }

   
    if (role && role !== existingUser.role) {
     
      const [currentRoleData] = await sequelize.query(`SELECT role_id FROM user_roles WHERE user_id = ? AND role_id = (SELECT id FROM roles WHERE role = ?)`, {
        replacements: [id, existingUser.role],
        type: sequelize.QueryTypes.SELECT,
        transaction,
      });

    
      if (currentRoleData && role !== existingUser.role) {
        const [newRoleData] = await sequelize.query(`SELECT id FROM roles WHERE role = ?`, {
          replacements: [role],
          type: sequelize.QueryTypes.SELECT,
          transaction,
        });

        console.log(currentRoleData,newRoleData,"this is the new role data")

        if (newRoleData) {
          await sequelize.query(`UPDATE user_roles SET role_id = ? WHERE user_id = ? AND role_id = ?`, {
            replacements: [newRoleData.id, id, currentRoleData.role_id],
            transaction,
          });
        }
      }
    }

    
    if (Array.isArray(documents)) {
      const existingDocs = await sequelize.query(`SELECT document_name FROM documents WHERE user_id = ?`, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT,
        transaction,
      });

      const existingDocNames = existingDocs.map(doc => doc.document_name);
      const docsToAdd = documents.filter(doc => !existingDocNames.includes(doc));
      const docsToRemove = existingDocNames.filter(doc => !documents.includes(doc));


      if (docsToAdd.length > 0) {
        const insertValues = docsToAdd.flatMap(doc => [id, doc]);
        const insertQuery = `INSERT INTO documents (user_id, document_name, createdAt, updatedAt) VALUES ${docsToAdd.map(() => "(?, ?, NOW(), NOW())").join(", ")}`;
        await sequelize.query(insertQuery, { replacements: insertValues, transaction });
      }


      if (docsToRemove.length > 0) {
        const deleteQuery = `DELETE FROM documents WHERE user_id = ? AND document_name IN (${docsToRemove.map(() => "?").join(", ")})`;
        await sequelize.query(deleteQuery, { replacements: [id, ...docsToRemove], transaction });
      }
    }

    await transaction.commit();
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Error updating user", details: error.message });
  }
};



exports.get_all_users_name = async (req, res) => {
  try {
    const get_users_query = `SELECT username,name,id,role FROM users WHERE is_disabled = false`;
    const all_users = await sequelize.query(get_users_query, {
      type: sequelize.QueryTypes.SELECT,
    });
    if (!all_users) return res.status(404).json({ type: "error", message: "No Users Found" })

    return res.status(200).json({ type: "success", data: all_users })
  } catch (error) {
    return res.status(400).json({ type: "error", message: error.message })
  }
}



exports.get_user_documents = async (req, res) => {
  try {
    let userId = req.query.userId;

    if (!userId) { return res.status(400).json(errorResponse("Please provide user id in the query params")) };

    let [findUser] = await sequelize.query(`SELECT * FROM users WHERE id = ${userId}`);

    if (findUser.length < 1) { return res.status(400).json(errorResponse("User not found with this user Id")) };

    let findDocumentsQuery = `SELECT document_name FROM documents WHERE user_id = ${userId}`;

    let [getDocuments] = await sequelize.query(findDocumentsQuery);

    return res.status(200).json(successResponse(getDocuments.length < 1 ? "No documents added for this employee" : "Documents retrieved successfully", getDocuments));

  } catch (error) {
    console.log('ERROR::', error)
    return res.status(400).json({ type: "error", message: error.message });
  };
}