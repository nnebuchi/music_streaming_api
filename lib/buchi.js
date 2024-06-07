"use strict";
const getOriginalWordFromCompoundWord = (compound_word) => {
    return compound_word === null || compound_word === void 0 ? void 0 : compound_word.replace('_', ' ');
};
const buchi_validate = (input, constraints, alias = null, fields) => {
    var _a, _b;
    const matchFinder = fields.find((field) => {
        return constraints.must_match === field.input.field;
    });
    if (input != null) {
        // Remove existing validation message
        // REGEX for valid email fields
        const email_pattern = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');
        // REGEX for special character fields
        const specialCharsRegex = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
        const number = /[0-9]/g;
        // Rules Definition
        const rules = {
            required: {
                pass: constraints.required === true ? (input.type != 'file' ? (((_a = input === null || input === void 0 ? void 0 : input.value) === null || _a === void 0 ? void 0 : _a.length) > 0) : (((_b = input === null || input === void 0 ? void 0 : input.files) === null || _b === void 0 ? void 0 : _b.length) > 0)) : true,
                message: alias === null ? getOriginalWordFromCompoundWord(input.field) + " is required" : alias + " is required"
            },
            min_length: {
                pass: constraints.hasOwnProperty('min_length') === true ? ((input === null || input === void 0 ? void 0 : input?.value?.length) > 0 ? input?.value?.length >= constraints?.min_length : true) : true,
                message: alias === null ? getOriginalWordFromCompoundWord(input.field) + " must have up to " + constraints.min_length + " characters" : alias + " must have up to " + constraints.min_length + " characters"
            },
            max_length: {
                pass: constraints.hasOwnProperty('max_length') === true ? (input.value.length > 0 ? input.value.length <= constraints.max_length : true) : true,
                message: alias === null ? getOriginalWordFromCompoundWord(input.field) + " must not exceed " + constraints.max_length + " characters" : alias + " must not exceed " + constraints.max_length + " characters"
            },
            email: {
                pass: constraints?.email === true && input?.value?.length > 0 ? email_pattern.test(input?.value) : true,
                message: alias === null ? getOriginalWordFromCompoundWord(input?.field) + " must be a valid email" : alias + " must be a valid email"
            },
            has_special_character: {
                pass: constraints?.has_special_character === true && input?.value?.length > 0 ? specialCharsRegex.test(input?.value) : true,
                message: alias === null ? getOriginalWordFromCompoundWord(input?.field) + " must have special character" : alias + " must have special character"
            },
            must_have_number: {
                pass: constraints?.hasOwnProperty('must_have_number') === true ? (input?.value?.length > 0 ? (constraints?.must_have_number === true ? number.test(input?.value) : true) : true) : true,
                message: alias === null ? getOriginalWordFromCompoundWord(input?.field) + " must have a number" : alias + " must have a number"
            },
            must_match: {
                pass: constraints?.hasOwnProperty('must_match') ? (input?.value?.length > 0 ? (matchFinder ? input?.value === matchFinder?.input?.value : false) : true) : true,
                message: alias === null ? getOriginalWordFromCompoundWord(input?.field) + " does not match the " + getOriginalWordFromCompoundWord(constraints === null || constraints === void 0 ? void 0 : constraints?.must_match) + " field" : alias + " does not match the " + getOriginalWordFromCompoundWord(constraints === null || constraints === void 0 ? void 0 : constraints?.must_match) + " field"
            },
            // unique:{
            //     pass: constraints?.hasOwnProperty('unique') === true ? (checkEmailInDB() ? false:true) : true,
            //     message: 
            // }
        };
        const feedback = [];
        for (let constraint in constraints) {
            if (rules.hasOwnProperty(constraint)) {
                const rule = rules[constraint];
                if (rule.pass === false) {
                    feedback.push({
                        target: input?.field,
                        message: rule.message
                    });
                }
            }
            else {
                return {
                    status: 'fail',
                    error: `invalid rule "${constraint}"`
                };
            }
        }
        if (feedback.length === 0) {
            return {
                status: "success",
            };
        }
        else {
            return {
                status: "fail",
                feedback: feedback
            };
        }
    }
    else {
        return {
            status: "fail",
            error: `${input} cannot be null`
        };
    }
};
exports.runValidation = (fields) => {
    const negatives = [];
    const errors = [];
    fields.forEach(function (field, index) {
        const result = buchi_validate(field.input, field.rules, field.alias, fields);
        if (result.error) {
            negatives.push(false);
        }
        else if ((result === null || result === void 0 ? void 0 : result.status) === 'success') {
            negatives.push(true);
        }
        else if (result === null || result === void 0 ? void 0 : result.feedback) {
            negatives.push(false);
            errors.push(result.feedback);
        }
    });
    if (negatives.includes(false)) {
        const nestedArray = errors;
        const groupedMessages = {};
        nestedArray.forEach(subarray => {
            subarray.forEach(item => {
                const { message, target } = item;
                if (!groupedMessages[target]) {
                    groupedMessages[target] = [message];
                }
                else {
                    groupedMessages[target].push(message);
                }
            });
        });
        return { status: false, errors: groupedMessages };
    }
    else {
        return { status: true };
    }
};
