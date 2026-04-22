const { errorResponse } = require("../utils/responseHandler")

const isEmptyValue = (value) => value === undefined || value === null || value === "";

const isValidType = (value, expectedType) => {
    if (expectedType === 'number') {
        return typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)));
    }
    return typeof value === expectedType;
};

const validateFields = (res, body, requiredFields = {}, optionalFields = {}) => {
    for (const [field, expectedType] of Object.entries(requiredFields)) {
        if (isEmptyValue(body[field])) {
            return res.status(400).json(errorResponse(`${field} is required.`));
        }

        if (!isValidType(body[field], expectedType)) {
            return res.status(400).json(errorResponse(`Invalid data type for field '${field}'. Expected '${expectedType}', but got '${typeof body[field]}'.`));
        }
    }

    for (const [field, expectedType] of Object.entries(optionalFields)) {
        if (isEmptyValue(body[field])) {
            continue;
        }

        if (!isValidType(body[field], expectedType)) {
            return res.status(400).json(errorResponse(`Invalid data type for field '${field}'. Expected '${expectedType}', but got '${typeof body[field]}'.`));
        }
    }

    return null;
};



const validateCreateUserDataTypes = (req, res, next) => {
    const body = req.body;

    const requiredFields = {
        name: 'string',
        username: 'string',
        email: 'string',
        mobile: 'string',
        gender: 'string',
        dob: 'string',
        doj: 'string',
        position: 'string',
        department: 'string',
        status: 'string',
        password: 'string',
        address: 'string',
        role: 'string'
    };

    const optionalFields = {
        emergency_contact_relationship: 'string',
        emergency_contact_name: 'string',
        emergency_contact: 'string',
        bank_name: 'string',
        account_number: 'string',
        ifsc: 'string',
        increment_date: 'string',
        skype_email: 'string',
        ultivic_email: 'string',
        salary: 'number',
        security: 'number',
        total_security: 'number',
        installments: 'number'
    };

    const validationError = validateFields(res, body, requiredFields, optionalFields);
    if (validationError) {
        return validationError;
    }

    next();
};






const validateLoginDAtaTypes = (req, res, next) => {
    const body = req.body;
    const requiredFields = {
        email: 'string',
        password: 'string',
    };

    const validationError = validateFields(res, body, requiredFields);
    if (validationError) {
        return validationError;
    }

    next();
};




const validateForgotPasswordDataTypes = (req, res, next) => {
    const body = req.body;
    const requiredFields = {
        email: 'string',
    };

    const validationError = validateFields(res, body, requiredFields);
    if (validationError) {
        return validationError;
    }

    next();
};





const validateResetPasswordDataTypes = (req, res, next) => {
    const body = req.body;
    const requiredFields = {
        password: "string",
        confirm_password: "string"
    };

    const validationError = validateFields(res, body, requiredFields);
    if (validationError) {
        return validationError;
    }

    next();
};





const validateChangePasswordDataTypes = (req, res, next) => {
    const body = req.body;
    const requiredFields = {
        password: "string",
        newPassword: "string"
    };

    const validationError = validateFields(res, body, requiredFields);
    if (validationError) {
        return validationError;
    }

    next();
};





const validateNewRoledDataTypes = (req, res, next) => {
    const body = req.body;
    const requiredFields = {
        role: "string",
    };

    const validationError = validateFields(res, body, requiredFields);
    if (validationError) {
        return validationError;
    }

    next();
};





const validateNewPermissionDataTypes = (req, res, next) => {
    const body = req.body;
    const requiredFields = {
        permission: "string",
    };

    const validationError = validateFields(res, body, requiredFields);
    if (validationError) {
        return validationError;
    }

    next();
};



const validateDisableRoleDataTypes = (req, res, next) => {
    const body = req.body;
    const requiredFields = {
        role_id: "number",
    };

    const validationError = validateFields(res, body, requiredFields);
    if (validationError) {
        return validationError;
    }

    next();
};



module.exports = {
    validateCreateUserDataTypes,
    validateLoginDAtaTypes,
    validateForgotPasswordDataTypes,
    validateResetPasswordDataTypes,
    validateChangePasswordDataTypes,
    validateNewRoledDataTypes,
    validateNewPermissionDataTypes,
    validateDisableRoleDataTypes
};
