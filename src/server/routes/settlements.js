const router = require('express').Router();
const { body } = require('express-validator');
const settlementController = require('../controllers/settlementController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.use(auth);

router.post(
  '/',
  [
    body('group_id').notEmpty().withMessage('Group ID is required.'),
    body('from_user').notEmpty().withMessage('From user is required.'),
    body('to_user').notEmpty().withMessage('To user is required.'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0.'),
  ],
  validate,
  settlementController.settle
);

router.patch('/:id/complete', settlementController.markCompleted);
router.get('/:groupId', settlementController.getSettlements);

module.exports = router;
