const ACCOUNTS = {
    'ACC-88392': {
        customer_name: 'Rahul Sharma',
        loan_type: 'Personal Loan',
        overdue_amount: 8499,
        dpd: 12,
        valid_codes: ['1995', '1234'],
    },
};

const CALL_LOG = [];
const CALL_DISPOSITIONS = new Map();

module.exports = {
    ACCOUNTS,
    CALL_LOG,
    CALL_DISPOSITIONS
};
