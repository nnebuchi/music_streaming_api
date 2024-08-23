const jwt = require('jsonwebtoken');
exports.verifyAuthToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send('Unauthorized');
    }
  
    const token = authHeader.split(' ')[1]; // Assuming 'Bearer <token>' format
  
    jwt.verify(token, process.env.AUTH_SEC_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).send('Forbidden\n' + err);
      }
  
      req.user = decoded; // Attach decoded user data to the request object
      next();
    });
};

exports.userCast = ["id", "password", "is_verified", "created_at", "updated_at"];

exports.excludeCast = async (data, cast_arr) =>{
  for(let prop in data){
    if(cast_arr.includes(prop)){
      console.log(prop);
      delete data[prop]
    }
  }
  return data;
}