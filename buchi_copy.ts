interface input {
    field: string;
    type: string;
    value:string;
    files: object[];
}

interface constraints {
    required: boolean;
    min_length: number;
    max_length: number;
    has_special_character: boolean;
    must_have_number: boolean;
    email: boolean;
    must_match: string;
}

interface fieldObjects {
    input:input;
    rules: constraints;
    alias:string|null;
}

const getOriginalWordFromCompoundWord = (compound_word:string) => {
    
    return compound_word?.replace('_', ' ');
}

const buchi_validate =  (input:input, constraints:constraints, alias:string|null=null, fields:fieldObjects[]) => {
    
    
    const matchFinder = fields.find((field) => {
        return constraints.must_match === field.input.field;
    })

    
    if(input != null){
        // Remove existing validation message
        
        // REGEX for valid email fields
        const email_pattern = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');
        
        // REGEX for special character fields
        const specialCharsRegex = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

        const number = /[0-9]/g;
        
        // Rules Definition
        
        const rules = {
            required:{
                pass:constraints.required === true ? (input.type != 'file' ? (input?.value?.length > 0): (input?.files?.length > 0)) : true,
                message:alias ===null ? getOriginalWordFromCompoundWord(input.field)  +" is required" : alias +" is required"
            },
            min_length:{
                pass:constraints.hasOwnProperty('min_length') === true ?(input?.value.length > 0 ? input.value.length >= constraints.min_length : true):true,
                message:alias ===null ? getOriginalWordFromCompoundWord(input.field) +" must have up to "+constraints.min_length+" characters" : alias +" must have up to "+constraints.min_length+" characters"
            },
            max_length:{
                pass:constraints.hasOwnProperty('max_length') === true ?(input.value.length > 0 ? input.value.length <= constraints.max_length : true):true,
                message:alias ===null ? getOriginalWordFromCompoundWord(input.field) +" must not exceed "+constraints.max_length+" characters" : alias+" must not exceed "+constraints.max_length+" characters"
            },
            email:{
                pass: constraints.email === true && input.value.length > 0 ? email_pattern.test(input.value): true,
                message:alias ===null ? getOriginalWordFromCompoundWord(input.field) +" must be a valid email" : alias+" must be a valid email"
            },
            has_special_character:{
                pass: constraints.has_special_character === true && input.value.length > 0 ? specialCharsRegex.test(input.value) : true,
                message:alias ===null ?  getOriginalWordFromCompoundWord(input.field)+" must have special character" : alias+" must have special character"
            },
            must_have_number:{
                pass: constraints.hasOwnProperty('must_have_number') === true ? (input.value.length > 0 ? (constraints.must_have_number === true ? number.test(input.value) : true): true):true,
                message:alias ===null ?  getOriginalWordFromCompoundWord(input.field)+" must have a number" : alias+" must have a number"
            },
            must_match:{
                pass:constraints.hasOwnProperty('must_match') ? (input.value.length > 0 ? (matchFinder ? input.value === matchFinder.input.value : false) : true):true,
                message:alias === null ? getOriginalWordFromCompoundWord(input.field)+" does not match the "+getOriginalWordFromCompoundWord(constraints?.must_match)+" field" : alias+" does not match the "+getOriginalWordFromCompoundWord(constraints?.must_match)+" field"
            }
            
        }

        const feedback:object[] = [];
        
        for (let constraint in constraints){
            
            if(rules.hasOwnProperty(constraint)){
                
                if(rules[constraint].pass === false){
                    
                    rules[constraint]['target'] = input.field
                    delete rules[constraint].pass
                    feedback.push(
                        rules[constraint]
                    )
                }

            }else{
                return {
                    status: 'fail',
                    error: `invalid rule "${constraint}"`
                }
            }
        
        }
        

        if(feedback.length === 0){
            return {
                status:"success",
            };
        }else{
            return {
                status:"fail",
                feedback:feedback
            };
        }
    }else{
        return {
            status:"fail",
            error: `${input} cannot be null`
        };
    }
    
}


exports.runValidation = (fields: fieldObjects[]) =>{
   
    const negatives:boolean[] = []
    const errors:any = []
    fields.forEach(function(field, index){
        
        const result = buchi_validate(field.input, field.rules, field.alias, fields);
       
       
        if(result.error ){
            negatives.push(false);
           
        }
        else if(result?.status === 'success'){
            negatives.push(true);
        }else{
            negatives.push(false);
            
            errors.push(result?.feedback)
        }
    });

    // console.log(errors);
    
  
    if(negatives.includes(false)){
        const nestedArray = errors
          
          const groupedMessages = {};
          
          nestedArray.forEach(subarray => {
            subarray.forEach(item => {
              const { message, target } = item;
          
              if (!groupedMessages[target]) {
                groupedMessages[target] = [message];
              } else {
                groupedMessages[target].push(message);
              }
            });
          });
        
        return {status:false, errors:groupedMessages}
    }else{
        return {status:true};
    }
}
