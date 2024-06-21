const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const argon2 = require('argon2');

exports.changePassword = async (old_password, new_password, user, res) => {
   
    try {
        
        const user_db_data = await prisma.users.findUnique({
            where: {email: user.email},
            select: { password: true },
        })

        
        const passwordCheck = await argon2.verify(user_db_data.password, old_password);
        
        if(!passwordCheck) {
            return res.status(400).json({ 
                status: 'fail',
                error: "Old password is incorrect"
            });
        }
        const HashedPassword = await argon2.hash(new_password)

        const updatePassword = await prisma.users.update({
            where: {email: user.email},
            data: {password: HashedPassword},
        });

        console.log(updatePassword);

        if(updatePassword) {
            return res.status(200).json({
                status:"success",
                message:"Password updated successfully",
            });
        }
    } catch (error) {
        res.status(400).json({ 
            status: 'fail',
            error: error
        });
    }

    
}


exports.updateProfile = async (data) => {
    
}