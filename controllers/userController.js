const { runValidation } = require('../lib/buchi');
const userService =  require('../services/userService');

exports.changePassword = async (req, res) => {
    const { old_password, new_password } = req.body;
    const validate = await runValidation([
        {
          input: { value: old_password, field: "old_password", type: "text" },
          rules: { required: true},
        },
        {
          input: { value: new_password, field: "new_password", type: "text" },
          rules: {
            required: true,
            has_special_character: true,
            min_length: 6,
            must_have_number: true,
          },
        },
  
    ]);

    if(validate){
        if(validate?.status === false) {
          return res.status(409).json({
              status:"fail",
              errors:validate.errors,
              message:"Request Failed",
          });
        }else{
          // const user_data = {}
          const user = req.user;
            return userService.changePassword(old_password, new_password, user, res);
          
        }
      }
    
}