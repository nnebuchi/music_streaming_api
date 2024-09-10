const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const argon2 = require('argon2');
const {userCast, socialsCast} = require('../utils/auth');
const { excludeCast} = require('../utils/generic');
const multer = require('multer');
const fs = require('fs');
const {processPath} = require('../utils/file');

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

exports.profile = async (user, res) => {
   
    try {
        const user_data = await prisma.users.findUnique({
            where:{email:user.email},
            include: {
                socialProfiles: {
                    select: { id: true, url:true, social_id:true}
                },
              },
        })
        return res.status(200).json({
            status: "success",
            message: "Profile Fetched",
            data: await excludeCast(user_data, userCast)
        });

    } catch (error) {
        return res.status(400).json({
            status: "fail",
            message: "Request Failed",
            data: error
        });
    }
}


exports.updateProfile = async (req, res) => {

    try {
        const user = await prisma.users.findUnique({
            where: {email: req.user.email}
        });
        if(user){
            const request_data = req.body 
            let update_data = {}
            for(let prop in request_data){
                if(prop in user && !userCast.includes(prop)){
                    console.log(prop);
                    
                    update_data[prop] = request_data[prop];
                }
            }

            const updateUser = await prisma.users.update({
                where: {email: user.email},
                data: update_data,
            });

            return res.status(200).json({
                status: "success",
                message: "Profile Updated",
                data: await excludeCast(updateUser, userCast)
            })
        }else{
            return res.status(404).json({
                status: "fail",
                error:"User not found",
                message: "User not found"
            })
        }
    } catch (error) {
        
    }
}

exports.updateSocials = async (req_user, request_data, res) => {
   
    try {
        const user = await prisma.users.findUnique({
            where: {email: req_user.email}
        });
        if(user){
            const socials = await prisma.socials.findMany();
            // console.log(request_data);
            socials.forEach( async social=>{
                // console.log(social.slug);
                if(social.slug in request_data){
                    let existing_social = await prisma.userSocialProfiles.findFirst({
                        where:{
                            social_id:social.id,
                            user_id:user.id
                        }
                    });
                   
                    
                    if(existing_social){
                        //  console.log(existing_social);
                        await prisma.userSocialProfiles.update({
                            where:{
                                id:existing_social.id
                            },
                            data:{
                                url:request_data[social.slug]
                            }
                        })
                    }else{
                        await prisma.userSocialProfiles.create({
                            data:{
                                user_id:user.id,
                                social_id:social.id,
                                url:request_data[social.slug]
                            }
                        })
                    } 
                }
                
            })
            

            return res.status(200).json({
                status: "success",
                message: "Socials Updated"
            })
        }else{
            return res.status(404).json({
                status: "fail",
                error:"User not found",
                message: "User not found"
            })
        }
    } catch (error) {
        return res.status(400).json({
            status: "fail",
            error:error,
            message: "Request Failed"
        })
    }
}

exports.socials = async (user, res) => {
    try {
        // const socials = await prisma.socials.findMany();
        
        const user_socials = await prisma.socials.findMany({
            include: {
              userSocialProfiles: {
                where: { user_id: user.id },
                select: { id: true, url:true, social_id:true}, // Select only the ID from UserSocialProfiles
              },
            },
          });

        return res.status(200).json({
            status:"success",
            data:  user_socials
        });
        
        // user_socials.map((social)=>{
        //     social.url = ``
        // })


    } catch (error) {
        return res.status(400).json({
            status:"fail",
            error:error,
            message:"Request Failed"
        });
    }
    
}

exports.deleteAccount = async (user, res) => {
    try {
        const user_db_data = await prisma.users.findUnique({
            where: {email: user.email}
        })

        if(user_db_data) {
           await prisma.users.delete({
                where: {email: user.email}
              });

              return res.status(200).json({ 
                status: 'success',
                error: "Account Deleted"
            });
        }else{
            return res.status(404).json({ 
                status: 'fail',
                error: "User not found"
            });
        }
        

    } catch (error) {
        return res.status(400).json({ 
            status: 'fail',
            error: error
        });
    }
}

exports.updateProfilePhoto = async (user, file, res) => {
    const file_path_on_db = await processPath(file);
    console.log(file_path_on_db);
    
    await prisma.users.findFirst({
       where:{ id:user.id}
    })
    .then(user_profile => {
         prisma.users.update({
            where:{
                id:user.id
            },
            data:{
                profile_photo:file_path_on_db
            }
        })
        .then(update_user_photo => {
            
            // delete old photo from folder
            if(user_profile.profile_photo){
                // check of file path exists and delete it
                if (fs.existsSync(`./public/${user_profile.profile_photo}`)) {
                    fs.unlinkSync(`./public/${user_profile.profile_photo}`);
                }
                
            }
            return res.status(200).json({
                status:"success",
                message:"Profile Photo Updated",
                file:file_path_on_db
            });
        })
    })
    .catch(err => {
        console.log(err);
        return res.status(200).json({
            status:"fail",
            message:"Profile Photo update failed",
            error: err
        });
    })

}

exports.updateCoverPhoto = async (user, file, res) => {
    try {
        if (!file || !file.path) {
            return res.status(400).json({
                status: "fail",
                message: "No file provided"
            });
        }

        let filePathOnDb = file.path.replace(/^public[\\\/]/, "").replace(/\\/g, "/");

        // Fetch the user profile
        const userProfile = await prisma.users.findFirst({ where: { id: user.id } });

        if (!userProfile) {
            return res.status(404).json({
                status: "fail",
                message: "User not found"
            });
        }

        // Update the user's cover photo
        await prisma.users.update({
            where: { id: user.id },
            data: { cover_photo: filePathOnDb }
        });

        // Delete the old cover photo if it exists
        if (userProfile.cover_photo && fs.existsSync(`./public/${userProfile.cover_photo}`)) {
            fs.unlinkSync(`./public/${userProfile.cover_photo}`);
        }

        return res.status(200).json({
            status: "success",
            message: "Cover Photo Updated",
            file: filePathOnDb
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "fail",
            message: "Profile Photo update failed",
            error
        });
    }
};