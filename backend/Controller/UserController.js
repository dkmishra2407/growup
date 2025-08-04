const express = require('express');
const UserModel = require('../Models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateRandomId = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const generateUsername = (name, email, mobileNo) => {
  const firstName = name.split(' ')[0].toLowerCase();
  const emailPart = email.split('@')[0].substring(0, 3).toLowerCase();
  const lastDigits = mobileNo.toString().slice(-4);
  const randomSuffix = generateRandomId(3);
  return `${firstName}${emailPart}${lastDigits}${randomSuffix}`;
};

module.exports.registerUser = async (req, res) => {
  try {
    const { Name, Email, Password, MobileNo } = req.body;
    
    if (!Name || !Email || !Password || !MobileNo) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    
    const user = await UserModel.findOne({ Email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    
    const watchlistId = generateRandomId();
    const exchangeId = generateRandomId();
    const holdingId = generateRandomId();
    
    const bcryptPassword = await bcrypt.hash(Password, 10);
    
    const username = generateUsername(Name, Email, MobileNo);
    
    const newUser = new UserModel({
      Name,
      Email,
      Password: bcryptPassword,
      MobileNo,
      WatchlistId: watchlistId,
      ExchangeId: exchangeId,
      Balance: 10000,
      HoldingId: holdingId,
      Date: Date.now(),
      Username: username
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.TOKEN_KEY || 'default_secret_key'
    );
    
    return res.status(200).json({ 
      msg: "User registered successfully",
      user: newUser,
      token: token
    });
    
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ msg: "Server error during registration" });
  }
};

module.exports.loginUser = async (req, res) => {
    try{
        const { Email, Password } = req.body;

        if(!Email || !Password){
            return res.status(400).json({ msg: "Please enter all fields" });
        }

        const user = await UserModel.findOne({ Email });

        if(!user){
            return res.status(400).json({ msg: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(Password, user.Password);

        if(!isMatch){
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id }, 
            process.env.TOKEN_KEY || 'default_secret_key',
        );


        return res.status(200).json({
            msg: "User logged in successfully",
            user: user,
            token: token
        });
    }
    catch(err){
        console.error("Login error:", err);
        return res.status(500).json({ msg: "Server error during login" });
    }
};
