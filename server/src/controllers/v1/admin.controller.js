import { AdminModel, UserModel } from "../../models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { SALT_ROUND, USER_ROLE } from "../../constant.js";
import { compareRole } from "../../utils/roleHelper.js";
import {
  checkArgsIfExists,
  checkIfStringArgsIsEmpty,
} from "../../utils/bodyHelper.js";

const cookieOptions = {
  maxAge: 1000 * 60 * 60 * 24,
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  domain: "localhost",
};

/**
 * Description: Registers A Admin
 *
 * body:
 *  firstName:
 *  lastName:
 *  email:
 *  password:
 *  confirmPassword:
 *
 */
export const registerAdmin = asyncHandler(async (req, res, next) => {
  try {
    // Get Data From Req Body
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    // Vailidate Data
    checkArgsIfExists(firstName, lastName, email, password, confirmPassword);
    checkIfStringArgsIsEmpty(
      firstName,
      lastName,
      email,
      password,
      confirmPassword
    );
    if (confirmPassword !== password) {
      throw new ApiError(400, "Password Doesn't Match");
    }
    // Check For Conflict
    const existingUser = await AdminModel.findOne({ email });
    if (existingUser) {
      throw new ApiError("User already exists", 409);
    }
    // EncryptPassword
    const encryptedPassword = await bcrypt.hash(password, SALT_ROUND);
    // Admin Model Instance
    const user = await AdminModel.create({
      firstName,
      lastName,
      email,
      password: encryptedPassword,
      Role: USER_ROLE.Admin,
    });

    //TODO: Implement Logger Module with File Logger --> Winston and Daily file
    console.log(user);

    // Save The Instance to Db
    await user.save();
    // Return Response
    return res
      .status(200)
      .json(new ApiResponse(200, "User created successfully", user));
  } catch (err) {
    // Handle Error At Gobal Level
    next(err);
  }
});

/**
 * Description: Sign in the User
 * Body:
 *  email:
 *  password:
 *  confirmPassword:
 */
export const loginAdmin = asyncHandler(async (req, res, next) => {
  try {
    // Data from Req Body
    const { email, password } = req.body;

    // Validate data
    checkArgsIfExists(email, password);
    checkIfStringArgsIsEmpty(email, password);

    if (email.indexOf("@") === -1) {
      throw new ApiError(400, "Invalid email");
    }

    // Find User
    const user = await AdminModel.findOne({ email });

    // Handle If no user was
    if (!user) {
      throw new ApiError(401, "Email Wrong");
    }

    // compare password
    const comparePassword = await bcrypt.compare(password, user.password);

    // Handle Mismatch Password
    if (!comparePassword) {
      throw new ApiError(401, "Password Wrong");
    }

    const adminToken = await user.generateLoginToken();
    return res
      .status(200)
      .cookie("adminToken", adminToken, cookieOptions)
      .json(new ApiResponse(200, "User logged in successfully", user));
  } catch (err) {
    next(err);
  }
});

/**
 * Description: Change Password For the Admin User.
 * Body:-
 *  currentPassword
 *  newPassword
 *  confirmPassword
 */

export const updatePassword = asyncHandler(async (req, res, next) => {
  try {
    // Data from Req Body
    const { newPassword, confirmPassword } = req.body;

    // Validate data
    checkArgsIfExists(newPassword, confirmPassword);
    checkIfStringArgsIsEmpty(newPassword, confirmPassword);

    if (!compareRole(req.user.role, USER_ROLE.Admin)) {
      throw new ApiError(401, "UnAuthorized Action");
    }

    if (newPassword !== confirmPassword) {
      throw new ApiError(400, "Confirm Password is Not Same as New Password");
    }

    // Find Admin User
    const user = await AdminModel.findOne({ email: req.user.email });

    // Handle user not Found
    if (!user) {
      throw new ApiError(404, "User Not Found");
    }

    // Create A Hash For Password
    const encryptedPassword = await bcrypt.hash(newPassword, SALT_ROUND);

    // Update Existing Model
    user.password = encryptedPassword;

    await user.save();

    return res.json(new ApiResponse(200, "Password Updated", user));
  } catch (err) {
    next(err);
  }
});

/**
 * Description : Log's out Admin
 */
export const logoutAdmin = asyncHandler(async (req, res) => {
  const { adminToken } = req.cookies;

  try {
    res.clearCookie("adminToken", adminToken, cookieOptions);
    return res
      .status(200)
      .json(new ApiResponse(200, "User logged out successfully"));
  } catch (error) {
    console.log(error);
    return res.status(400).send(error.message);
  }
});

/**
 * Description: Change Password For the Admin User.
 * Body:-
 */
const AdminUpdate = asyncHandler(async (req, res) => {
  // TODO: Complete This Code
});

const AdminDelete = asyncHandler(async (req, res) => {
  // TODO:
});

const getAdminDashboard = asyncHandler(async (req, res) => {
  // TODO: Complete This Code
});

const getAdminProfile = asyncHandler(async (req, res) => {
  // TODO: Complete This Code
});


export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;
  console.log(req.body);

  if(!firstName || !lastName || !email || !password || !phoneNumber) {
    throw new ApiError("Missing required fields", 400);
  }

  console.log(req.body);
 
  try {
    const exists = await UserModel.findOne({ email });

    if (exists) {
      return res.status(400).send("User already exist");
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    console.log(encryptedPassword);
    const user = new UserModel({
      firstName,
      lastName,
      email,
      password: encryptedPassword,
      phoneNumber,
      isActive: true


    });

    await user.save();

    const id = user._id;

    if (!user) {
      throw new ApiError("problem in registering user", 404);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "User created successfully", user, id));

  } 
  
  catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
});


const deleteUser = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new ApiError("User not registered", 404);
    }

    await user.remove();
    return res
      .status(200)
      .json(new ApiResponse(200, "User deleted successfully"));
  } catch (error) {}
});

const getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await UserModel.find({});

    return res
      .status(200)
      .json(new ApiResponse(200, "User deleted successfully", users));
  } catch (error) {}
});

 
