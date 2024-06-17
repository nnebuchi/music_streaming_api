const { runValidation } = require('../lib/buchi');
const userAuthService =  require('../services/userAuthService');


exports.createUser = async (req, res) => {
  const user_data = {email, first_name, last_name, password } = req.body;
  
  const validate = await runValidation([

    {
      input: { value: email, field: "email", type: "text" },
      rules: { required: true, email: true, unique:'User'},
    },

    {
      input: { value: password, field: "password", type: "text" },
      rules: {
        required: true,
        has_special_character: true,
        min_length: 6,
        must_have_number: true,
      },
    },

    {
      input: { value: first_name, field: "first_name", type: "text" },
      rules: { required: true, min_length: 2 },
    },
    {
      input: { value: last_name, field: "last_name", type: "text"},
      rules: { required: true, min_length: 2 },
      alias:"surname"
    },
  ]);

  if(validate){
    if(validate?.status === false) {
      return res.status(409).json({
          status:"fail",
          errors:validate.errors,
          message:"Registration Failed",
      });
    }else{
      // const user_data = {}
      return userAuthService.createUser(user_data, res)
      
    }
  }
  

  
};


exports.loginUser = async(req, res) => {
  const req_data = {email, password} = req.body;
  const validate = await runValidation([
    {
      input: { value: email, field: "email", type: "text" },
      rules: { required: true, email: true},
    },
    {
      input: { value: password, field: "password", type: "text" },
      rules: { required: true},
    }
  ])

  if(validate){
    if(validate?.status === false) {
      return res.status(409).json({
          status:"fail",
          errors:validate.errors,
          message:"Login Failed",
      });
    }else{
      return userAuthService.loginUser(req_data, res)
      
    }
  }
}