const express=require('express');
const authController=require('../controllers/auth.controller.js');
const authMiddleware=require('../middlewares/auth.middleware.js');
const router=express.Router();
router.post('/register',authController.registerUser);
router.post('/login',authController.loginUser);
router.post('/logout',authController.logout);
router.patch('/update',authMiddleware.authUser,authController.updateUsername);

router.patch('/updatePassword',authMiddleware.authUser,authController.ChangePassword);
router.delete('/delete',authMiddleware.authUser,authController.DeleteAccount);

module.exports=router;
 