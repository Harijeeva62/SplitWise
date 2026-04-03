const router = require('express').Router();
const { body } = require('express-validator');
const groupController = require('../controllers/groupController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.use(auth);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Group name is required.')],
  validate,
  groupController.createGroup
);

router.get('/', groupController.getGroups);
router.get('/all', groupController.getAllGroups);
router.get('/search-users', groupController.searchUsers);
router.get('/:id', groupController.getGroupById);

router.post('/:id/join', groupController.requestJoin);
router.get('/:id/join-requests', groupController.getJoinRequests);
router.post(
  '/:id/join-requests/:requestId',
  [body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject.')],
  validate,
  groupController.handleJoinRequest
);

router.post(
  '/:id/members',
  [body('email').isEmail().withMessage('Valid email is required.')],
  validate,
  groupController.addMember
);

router.delete('/:id/members/:userId', groupController.removeMember);

module.exports = router;
