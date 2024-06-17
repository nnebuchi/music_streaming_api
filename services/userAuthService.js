const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const argon2 = require('argon2');
const crypto = require('crypto');
const {send_mail} = require('./mail/accountVerification');
const jwt = require('jsonwebtoken');
const secretKey= process.env.AUTH_SEC_KEY;
const {generateOTP} = require('../utils/generic');


exports.createUser = async(user_data, res) => {
    try {
        const HashedPassword = await argon2.hash(user_data?.password)
        user_data.password = HashedPassword;
        // console.log(user_data);
        
        const user = await prisma.user.create({
            data:user_data
        });

        if(user){
            const code = await generateOTP();
            const storeOtp = await saveOtp(code, user.email);
            if(storeOtp){
                
                await send_mail({ name: user.first_name, code: code, email:user.email }, res)
                return res.status(201).json({
                    status:"success",
                    message:"registration successful, check your email for a verification code",
                });
            }else{
                return res.status(200).json({
                    status:"success",
                    message:"registration successful, but OTP was not sent. Kindly resend OTP",
                });
            }
            
        }

    } catch (error) {
        res.status(400).json({ 
            status: 'fail',
            error: error.message
        });
    }
   
}

const saveOtp = async (otp, email) => {
    try {
        // const existingOtp = await prisma.findMany()
        await prisma.otp.deleteMany({
            where: {email:email},
        });
       
        return await prisma.otp.create({
            data:{ email:email, otp:otp.toString()}
        });

        

    } catch (error) {
        console.log(error);
        return false
    }
}

exports.loginUser = async(req_data, res) => {
    try {
        const user = await prisma.user.findUnique({
            where:{email:req_data.email}
        });

        if(user){
            const passwordCheck = argon2.verify(user.password, req_data.password);
            if(passwordCheck){
                const key = crypto.randomBytes(64).toString('hex');
                const payload = {
                    id: user.id,
                    email: user.email
                }
        
                const options = {
                    expiresIn: 365 * 24 * 60 * 60,
                    // httpOnly: true
                }
                return res.status(200).json({
                    status:"success",
                    message:"login successful",
                    token: jwt.sign(payload, secretKey, options)
                })
            }else{
                return res.status(200).json({
                    status:"fail",
                    message:"login failed",
                    error:"Invalid Credentials"
                });
            }
           
        }else{
            return res.status(200).json({
                status:"fail",
                message:"login failed",
                error:"Invalid Credentials"
            });
        }
       
    } catch (error) {
        return res.status(400).json({ 
            status: 'fail',
            error: error.message
        });
    }
   
}

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send('Unauthorized');
    }
  
    const token = authHeader.split(' ')[1]; // Assuming 'Bearer <token>' format
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).send('Forbidden');
      }
  
      req.user = decoded; // Attach decoded user data to the request object
      next();
    });
  };
