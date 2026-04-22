exports.successResponse = (message = 'success' , data = null, extraData = null) => ({
    type: "success",
    message : message && message,
    data : data && data,
    extraData : extraData && extraData
})

exports.errorResponse = (message, loggedError = null) => ({
    type: "error",
    message,
    loggedError
})
