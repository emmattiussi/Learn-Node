const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController')
const userController = require('../controllers/userController')
const authController = require('../controllers/authController')

const { catchErrors } = require('../handlers/errorHandlers.js')

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);
router.get('/stores', catchErrors(storeController.getStores));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug))

router.post('/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);

router.post('/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get('/stores/:id/edit', catchErrors(storeController.editStore))

router.get('/tags', catchErrors(storeController.getStoresByTag))
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag))

router.get('/login', userController.loginForm)
router.get('/register', userController.registerForm)
// Validate registration data, Register the user, We need to log them in.
router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
)

module.exports = router;
