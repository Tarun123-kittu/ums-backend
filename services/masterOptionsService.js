const MASTER_OPTIONS = {
    documents: [
        { key: 'N/A', label: 'N/A' },
        { key: 'Photograph', label: 'Photograph' },
        { key: 'Adhar', label: 'Adhar' },
        { key: 'Pan', label: 'Pan' },
        { key: '10th', label: '10th' },
        { key: '12th', label: '12th' },
        { key: 'Graduation', label: 'Graduation' },
        { key: 'Master', label: 'Master' },
        { key: 'Training', label: 'Training' },
        { key: 'Experience letter', label: 'Experience letter' },
    ],
    positions: [        
        { key: 'N/A', label: 'N/A' },
        { key: 'Intern', label: 'Intern' },
        { key: 'Trainee', label: 'Trainee' },
        { key: 'Jr. Developer', label: 'Jr. Developer' },
        { key: 'Developer', label: 'Developer' },
        { key: 'Sr. Developer', label: 'Sr. Developer' },
        { key: 'Project Manager', label: 'Project Manager' },
        { key: 'HR', label: 'HR' },
        { key: 'Tester', label: 'Tester' },
        { key: 'BDE', label: 'BDE' },
        { key: 'Team Lead', label: 'Team Lead' },
        { key: 'Co-Founder/ Chief Executive Officer', label: 'Co-Founder/ Chief Executive Officer' },
    ],
    departments: [
        { key: 'N/A', label: 'N/A' },
        { key: 'Front End', label: 'Front End' },
        { key: 'Back End', label: 'Back End' },
        { key: 'Full Stack', label: 'Full Stack' },
        { key: 'Management', label: 'Management' },
    ],
    statuses: [
        { key: 'Terminated', label: 'Terminated' },
        { key: 'On Probation', label: 'On Probation' },
        { key: 'Confirmed', label: 'Confirmed' },
        { key: 'Resignation', label: 'Resignation' },
    ],
    genders: [
        { key: 'Male', label: 'Male' },
        { key: 'Female', label: 'Female' },
        { key: 'Other', label: 'Other' },
    ],
    working_schedules: [
        { key: 'Full Time', label: 'Full Time' },
        { key: 'Split', label: 'Split' },
        { key: 'Part Time', label: 'Part Time' },
    ],
};

const getAllMasterOptions = () => MASTER_OPTIONS;

const getMasterOptionsByCategory = (category) => MASTER_OPTIONS[category] || null;

module.exports = {
    getAllMasterOptions,
    getMasterOptionsByCategory,
};