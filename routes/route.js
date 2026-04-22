const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const rolesPermissionsController = require("../controllers/rolesAndPermissionController")
const holidaysAndEventsController = require("../controllers/holidaysAndEventsController")
const attendanceController = require("../controllers/attendanceController")
const hrRoundController = require("../controllers/hrRoundControllers")
const languageController = require("../controllers/languagesControllers")
const testSeriesController = require("../controllers/testSeriesController")
const technicalQuestionsController = require("../controllers/technicalRoundQuestionsController")
const leaveController = require("../controllers/leaveController")
const finalRoundsController = require("../controllers/finalRoundsController")
const dashboardController = require("../controllers/dashboardControllers")
const interviewLeadsController = require('../controllers/interviewLeads')
const authenticateToken = require("../middleware/authenticaionMiddleware")
const {
    createUserValidator,
    loginValidator,
    forgetPasswordValidator,
    validateChangePassword,
    validateUpdateRolesPermission,
    validateAssignRolesPermission,
    validateDeleteUserRole,
    validateHolidaysAndEvents,
    assignRoleValidations,
    validateUnmarkAttendance,
    validateGetAttendanceDetails,
    validateUpdateUserAttendance,
    validateLeaveRequest,
    validateCreateLeads,
    validateUpdateLead,
    validateHrRound,
    validateHrRoundResult,
    validateUpdateLeadResonse,
    validateCreateLanguage,
    ValidateGetLanguage,
    ValidateUpdateLanguage,
    ValidateCreateSeries,
    ValidateGetSeries,
    ValidateUpdateSeries,
    validateCheckLeadAnswer,
    validateFaceToFaceOrFinalRound,
    validateUpdateInRound,
    updateUserValidator
} = require('../middleware/validationMiddleware')

const {
    validateLoginDAtaTypes,
    validateForgotPasswordDataTypes,
    validateResetPasswordDataTypes,
    validateChangePasswordDataTypes,
} = require("../middleware/validateUserDataTypes")






// user auth routes 
router.post("/create-user", authenticateToken, createUserValidator, userController.create_user)
router.post("/login", loginValidator, validateLoginDAtaTypes, userController.login)
router.post("/forgot-password", forgetPasswordValidator, validateForgotPasswordDataTypes, userController.forgot_password)
router.post("/reset-password/:token", validateResetPasswordDataTypes, userController.reset_password)
router.post("/change-password", authenticateToken, validateChangePassword, validateChangePasswordDataTypes, userController.change_password)
router.get("/get-employees", authenticateToken, userController.get_employees)
router.get("/get-employee-details", authenticateToken, userController.get_employee_details)
router.put("/update-user", authenticateToken, updateUserValidator, userController.update_user)
router.patch("/delete-employee/:id", authenticateToken, userController.delete_employee)
router.get("/get-all-username", authenticateToken, userController.get_all_users_name)
router.get("/get-user-documents", authenticateToken, userController.get_user_documents)




// roles and permissions
router.get("/get-user-permissions", authenticateToken, rolesPermissionsController.get_user_permissions)
router.get("/get-roles-and-users", authenticateToken, rolesPermissionsController.get_roles_and_users)
router.post("/assign-role", authenticateToken, assignRoleValidations, rolesPermissionsController.assign_role)
router.post("/assign-new-permissions-to-roles", authenticateToken, validateAssignRolesPermission, rolesPermissionsController.assign_new_permissions_to_new_role)
router.patch("/update-permissions-assigned-to-role", authenticateToken, validateUpdateRolesPermission, rolesPermissionsController.update_permissions_assigned_to_role)
router.patch("/delete-role", authenticateToken, rolesPermissionsController.disabled_role)
router.delete("/delete-user-role", authenticateToken, validateDeleteUserRole, rolesPermissionsController.delete_user_role)
router.get("/get-roles-permissions", authenticateToken, rolesPermissionsController.get_roles_permissions)
router.get("/get-role-assigned-to-users", authenticateToken, rolesPermissionsController.get_role_assigned_to_users)
router.get("/get-all-roles", authenticateToken, rolesPermissionsController.get_all_roles)
router.get('/get-permissions',authenticateToken,rolesPermissionsController.get_permissions)





//holidays and events
router.post("/add-holiday-or-event", authenticateToken, validateHolidaysAndEvents, holidaysAndEventsController.add_holidayOrEvent)
router.put("/update-holiday-or-event", authenticateToken, holidaysAndEventsController.update_holidayOrEvent)
router.get("/get-all-holidays-or-events", authenticateToken, holidaysAndEventsController.get_all_holidaysOrEvents)
router.delete("/delete-holiday-or-event", authenticateToken, holidaysAndEventsController.delete_holidayOrEvent)
router.get("/get-holiday-and-event", authenticateToken, holidaysAndEventsController.get_holidayOrEvent)
router.get("/get-events-and-birthdays", authenticateToken, holidaysAndEventsController.get_events_and_birthdays)
router.get("/get-current-and-next-month-events", authenticateToken, holidaysAndEventsController.get_current_and_next_month_events)





// attendance
router.post("/mark-attendance", authenticateToken, attendanceController.mark_attendance)
router.post("/unmark-attendance", authenticateToken, validateUnmarkAttendance, attendanceController.unmark_attendance)
router.get("/get-attendance-details", authenticateToken, validateGetAttendanceDetails, attendanceController.get_attendance_details)
router.put("/update-attendance-details", authenticateToken, validateUpdateUserAttendance, attendanceController.update_attendance_details)
router.get("/get-attendances", authenticateToken, attendanceController.get_attendances)
router.get("/get-attendances-report", authenticateToken, attendanceController.get_attendance_report)
router.put("/mark-break", authenticateToken, attendanceController.mark_break)
router.put("/unmark-break", authenticateToken, attendanceController.unmark_break)
router.get("/get-user-monthly-report", authenticateToken, attendanceController.get_user_monthly_report)




// leave routes
router.post("/apply-leave", authenticateToken, validateLeaveRequest, leaveController.apply_leave)
router.get("/get-applied-leaves", authenticateToken, leaveController.all_applied_leaves)
router.get("/get-user-pending-leaves", authenticateToken, leaveController.calculate_pending_leaves_for_selected_user)
router.put("/update-pending-leaves", authenticateToken, leaveController.update_pending_leave)
router.get("/all-user-applied-leaves", authenticateToken, leaveController.get_all_users_pending_leaves)
router.get("/get-applied-leave-detail", authenticateToken, leaveController.get_applied_leave_details)
router.get("/all-users-pending-leaves", authenticateToken, leaveController.calculate_pending_leaves_for_all_users)
router.get("/leave-bank-report", authenticateToken, leaveController.leave_bank_report)
router.get("/user-applied-leaves", authenticateToken, leaveController.get_user_applied_leaves)
router.put("/update-user-leave-bank", authenticateToken, leaveController.update_user_leave_bank)
router.put('/change-leave-status',authenticateToken,leaveController.change_leave_status)




//interview leads
router.post("/create-lead", authenticateToken, validateCreateLeads, interviewLeadsController.create_lead)
router.get("/get-lead", authenticateToken, validateUpdateLead, interviewLeadsController.get_lead)
router.put("/update-lead", authenticateToken, validateUpdateLead, interviewLeadsController.update_lead)
router.get("/get-all-leads", authenticateToken, interviewLeadsController.get_all_leads)
router.delete("/delete-lead", authenticateToken, validateUpdateLead, interviewLeadsController.delete_lead)
router.get("/get-face-to-face-round-leads", authenticateToken, interviewLeadsController.get_face_to_face_round_leads)
router.get("/get-final-round-leads", authenticateToken, interviewLeadsController.get_final_round_leads)
router.delete('/delete-lead-records', authenticateToken, interviewLeadsController.delete_lead_records)




//hr round 
router.get("/get-hr-round-questions", authenticateToken, hrRoundController.get_hr_round_questions)
router.post("/hr-round", authenticateToken, validateHrRound, hrRoundController.hr_round)
router.put("/hr-round-result", authenticateToken, validateHrRoundResult, hrRoundController.hr_round_result)
router.put("/update-lead-response", authenticateToken, validateUpdateLeadResonse, hrRoundController.update_lead_response)
router.get("/get-hr-assign-questions-to-lead", authenticateToken, hrRoundController.get_hr_assign_questions_to_lead)
router.get("/get-hr-round-candidate", authenticateToken, hrRoundController.get_hr_round_candidate)
router.get("/get-hr-round-assign-questions-to-lead", authenticateToken, hrRoundController.get_hr_round_assign_questions_to_lead)
router.put("/update-key-point", authenticateToken, hrRoundController.update_key_point)
router.put("/send-test-link", authenticateToken, hrRoundController.sendLeadInterviewLink)



//languages
router.post("/create-language", authenticateToken, validateCreateLanguage, languageController.create_language)
router.get("/get-all-languages", authenticateToken, languageController.get_all_languages)
router.get("/get-language", authenticateToken, ValidateGetLanguage, languageController.get_language)
router.put("/update-language", authenticateToken, ValidateUpdateLanguage, languageController.update_language)
router.delete("/delete-language", authenticateToken, ValidateGetLanguage, languageController.delete_language)




//test series 
router.post("/create-series", authenticateToken, ValidateCreateSeries, testSeriesController.create_series)
router.get("/get-all-series", authenticateToken, testSeriesController.get_all_series)
router.get("/get-series", authenticateToken, ValidateGetSeries, testSeriesController.get_series)
router.put("/update-series", authenticateToken, ValidateUpdateSeries, testSeriesController.update_series)
router.delete("/delete-series", authenticateToken, ValidateGetSeries, testSeriesController.delete_series)
router.get("/get-language-test-series", authenticateToken, testSeriesController.get_specific_language_series)




//technical round questions
router.post("/add-objective", authenticateToken, technicalQuestionsController.add_objective)
router.post("/add-subjective", authenticateToken, technicalQuestionsController.add_subjective)
router.post("/add-logical", authenticateToken, technicalQuestionsController.add_logical)
router.get("/get-questions-answers", authenticateToken, technicalQuestionsController.get_questions_answers)
router.get("/get-lead-questions", technicalQuestionsController.get_lead_questions)
router.post("/submit-technical-round", technicalQuestionsController.submit_technical_round)
router.get("/get-logical-subjective-questions", authenticateToken, technicalQuestionsController.get_logical_subjective_questions)
router.get("/get-objective-questions", authenticateToken, technicalQuestionsController.get_objective_questions)
router.put("/update-logical-and-subjective-question", authenticateToken, technicalQuestionsController.update_subjective_and_logical_question)
router.put("/update-objective-question", authenticateToken, technicalQuestionsController.update_objective)
router.delete("/delete-subjective", authenticateToken, technicalQuestionsController.delete_subjective)
router.delete("/delete-objective", authenticateToken, technicalQuestionsController.delete_objective)
router.get("/all-technical-round-leads", authenticateToken, technicalQuestionsController.get_all_technical_round_leads)
router.put("/update-status", authenticateToken, technicalQuestionsController.update_technical_lead_status)
router.get("/verify-lead", technicalQuestionsController.check_lead_and_token)
router.put("/start-test", technicalQuestionsController.start_test)
router.put("/technical-round-result", authenticateToken, technicalQuestionsController.technical_round_result)
router.get("/get-lead-technical-response", authenticateToken, technicalQuestionsController.get_lead_technical_response)
router.put("/check-lead-answer", authenticateToken, validateCheckLeadAnswer, technicalQuestionsController.check_lead_answer)
router.get('/get-tech-round-test-submit-status',technicalQuestionsController.get_tech_round_test_submit_status)




//final and face-to-face round
router.put("/final-or-face-to-face-round", authenticateToken, validateFaceToFaceOrFinalRound, finalRoundsController.final_or_face_to_face_round)
router.put("/update-in-round-count", authenticateToken, validateUpdateInRound, finalRoundsController.update_in_round_count)



//dashbord
router.get("/get-dashboard-leaves", authenticateToken, dashboardController.get_dashboard_leaves)
router.get("/get-dashboard-interview-leads-overview", authenticateToken, dashboardController.get_dashboard_interview_leads_overview)
router.get("/get-employees-working-time", authenticateToken, dashboardController.get_employees_working_time)
router.get("/get-user-today-attendance", authenticateToken, dashboardController.get_user_today_attendance)
router.get("/get-all-present-employee", authenticateToken, dashboardController.get_all_present_employee)
router.get("/get-all-on-leave-employees", authenticateToken, dashboardController.get_all_on_leave_employees)
router.get("/get-all-interviews", authenticateToken, dashboardController.get_all_interviews)



//employee dashboard
router.get("/get-employee-leaves-record",authenticateToken,dashboardController.get_employee_leaves_record)
router.get("/get-all-employees-accepted-leaves",authenticateToken,dashboardController.get_all_employees_accepted_leaves)
router.post("/create-task",authenticateToken,dashboardController.create_task)
router.get("/get-tasks",authenticateToken,dashboardController.get_tasks)
router.put("/shift-task",authenticateToken,dashboardController.shift_task)
router.get('/get-notifications',authenticateToken,dashboardController.get_notifications)
router.put('/mark-notifications-as-read',authenticateToken,dashboardController.mark_notifications_as_read)
router.get('/get-employee-monthly-leave-report',authenticateToken,dashboardController.get_employee_monthly_leave_report)


module.exports = router