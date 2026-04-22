const { sequelize } = require('../models');
const { successResponse, errorResponse } = require("../utils/responseHandler")
const userService = require("../services/userServices")
const SOMETHING_WENT_WRONG = "Something went wrong. Please try again later."




exports.create_user = async (req, res) => {
  try {
    const result = await userService.createUserService(req.body, sequelize);

    if (!result.success) {
      return res.status(400).json(errorResponse("Something went wrong ", result.message));
    }

    return res.status(201).json(successResponse(result.message, result.data));

  } catch (error) {
    console.error("Controller ERROR::", error);
    return res.status(500).json(errorResponse(SOMETHING_WENT_WRONG, error.message));
  }
};




exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await userService.loginService(email, password, sequelize);

    if (!result.success) {
      return res.status(400).json(
        errorResponse("Something went wrong", result.message)
      );
    }

    return res.status(200).json(
      successResponse(result.message, result.data, result.extraData)
    );

  } catch (error) {
    console.error("Controller ERROR::", error);
    return res.status(500).json(errorResponse(SOMETHING_WENT_WRONG, error.message));
  }
};



exports.forgot_password = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await userService.forgotPasswordService(email, sequelize);

    if (!result.success) { return res.status(400).json(errorResponse(result.message)); }

    return res.status(200).json(successResponse(result.message));

  } catch (error) {
    console.error("Controller ERROR::", error);
    return res.status(500).json(errorResponse(SOMETHING_WENT_WRONG, error.message));
  }
};



exports.reset_password = async (req, res) => {
  try {
    const token = req.params.token;
    const { password, confirm_password } = req.body;

    const result = await userService.resetPasswordService(
      token,
      password,
      confirm_password,
      sequelize
    );

    if (!result.success) { return res.status(400).json(errorResponse(result.message)); }

    return res.status(200).json(successResponse(result.message));

  } catch (error) {
    console.error("Controller ERROR::", error);
    return res.status(500).json(errorResponse(SOMETHING_WENT_WRONG, error.message));
  }
};




exports.change_password = async (req, res) => {
  try {
    const userId = req.result.user_id;
    const { password, newPassword } = req.body;

    const result = await userService.changePasswordService(
      userId,
      password,
      newPassword,
      sequelize
    );

    if (!result.success) { return res.status(400).json(errorResponse(result.message)); }

    return res.status(200).json(successResponse(result.message));

  } catch (error) {
    console.error('Controller ERROR:', error);
    return res.status(500).json(errorResponse(SOMETHING_WENT_WRONG, error.message));
  }
};




exports.get_employees = async (req, res) => {
  try {
    const result = await userService.getEmployeesService(req.query, sequelize);

    if (!result.success) {
      return res.status(400).json(errorResponse(result.message));
    }

    const data = {
      data: result.data,
      pagination: result.pagination
    }

    return res.status(200).json({
      type: "success",
      message: result.message,
      data: data

    });

  } catch (error) {
    console.log('Controller ERROR::', error);
    return res.status(500).json(errorResponse(SOMETHING_WENT_WRONG, error.message));
  }
};



exports.get_employee_details = async (req, res) => {
  try {
    const { id } = req.query;

    const result = await userService.getEmployeeDetailsService(id, sequelize);

    if (!result.success) {
      return res.status(400).json(
        errorResponse(result.message)
      );
    }

    return res.status(200).json({
      type: "success",
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.log("Controller ERROR::", error);
    return res.status(500).json(errorResponse(SOMETHING_WENT_WRONG, error.message));
  }
};


exports.update_user = async (req, res) => {
  try {
    const result = await userService.updateUserService(req.body, sequelize);

    if (!result.success) { return res.status(400).json(errorResponse(result.message)); }

    return res.status(200).json(successResponse(result.message));

  } catch (error) {
    console.error("Controller ERROR:", error);
    return res.status(500).json(errorResponse(SOMETHING_WENT_WRONG, error.message));
  }
};


exports.get_all_users_name = async (req, res) => {
  try {
    const result = await userService.getAllUsersNameService(req.query, sequelize);

    if (!result.success) {
      return res.status(404).json(errorResponse(result.message));
    }

    return res.status(200).json(successResponse(result.message, { data: result.data, pagination: result.pagination }));

  } catch (error) {
    console.error("Controller ERROR:", error);
    return res.status(500).json(errorResponse(SOMETHING_WENT_WRONG, error.message));
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