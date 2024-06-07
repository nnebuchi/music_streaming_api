const { runValidation } = require('../lib/buchi');
const userAuthService =  require('../services/userAuthService')


exports.createUser = async (req, res) => {
  const user_data = {email, first_name, last_name, password } = req.body;
  // const email = req?.body?.email;
  // const password = req?.body?.password;
  // const first_name = req?.body?.first_name;
  // const last_name = req?.body?.last_name;

  
  const validate = runValidation([

    {
      input: { value: email, field: "email", type: "text" },
      rules: { required: true, email: true },
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

  if (validate?.status === false) {
    return res.status(409).json({
        status:"fail",
        errors:validate.errors,
        message:"Registration Failed",
    });
    }else{
      // const user_data = {}
      return userAuthService.createUser(user_data, res)
      
  }

  
};