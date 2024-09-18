const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const jwt = require('jsonwebtoken');
exports.verifyAuthToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send('Unauthorized');
    }
    
    const token = authHeader.split(' ')[1]; // Assuming 'Bearer <token>' format
  
    jwt.verify(token, process.env.AUTH_SEC_KEY, async (err, decoded) => {
      if (err) {
        console.log(err);
        
        
        return res.status(403).send('Unauthorized');
      }
      
      const isBlackListed = await this.tokenIsBlackListed(token)
      
      if(isBlackListed){
        console.log(isBlackListed);
        
        return res.status(403).send('Unauthorized');
      }

      req.user = decoded; // Attach decoded user data to the request object
      next();
    });
};

exports.tokenIsBlackListed = async (raw_token) => {
  // console.log(raw_token);
  
    const blackList = await prisma.blackListToken.findMany({
        where:{
            token:raw_token
        }
    });
    console.log(blackList)
    if(blackList?.length > 0){
      console.log("blackList");
      
      return true
    }else{
      return false
    }
}

// exports.
exports.userCast = ["id", "password", "created_at", "updated_at"];

exports.creatorCast = ["password", "created_at", "updated_at"];
