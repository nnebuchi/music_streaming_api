const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const argon2 = require('argon2');

exports.createUser = async(user_data, res) => {
    try {
        const HashedPassword = await argon2.hash(user_data?.password)
        user_data.password = HashedPassword;
        console.log(user_data);
        
        const user = await prisma.user.create({
            data:user_data
        });
        res.status(201).json({
            status:"success",
            message:"registration successful",
        });
    } catch (error) {
        res.status(400).json({ 
            status: 'fail',
            error: error.message
        });
    }
   
}