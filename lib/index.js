'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.validators = exports.messages = undefined;
exports.default = validate;
exports.validateValue = validateValue;
exports.recursiveValidate = recursiveValidate;
exports.rules = rules;

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _inputmaskCore = require('inputmask-core');

var _inputmaskCore2 = _interopRequireDefault(_inputmaskCore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Validates an object or value.
 * @param  {*} objectOrValue - A deeply nested object or a value.
 * @param  {Rules} rules - Validation rules.
 * @param  {Options} options - Additional options.
 * @return {Object|Boolean} - If an object was validated, an object containing errors for each key is returned. A single error is returned if a single value was validated.
 * @example
 * var object = {
 *     emailAddress: "example@example.com",
 *     password: ""
 * }
 * var rules = {
 *     emailAddress:{
 *         validate:true,
 *         email:true,
 *         required:true,
 *     }
 *     password:{
 *         validate:true,
 *         required:true,
 *     }
 * };
 * validate(object, rules);
 * // Returns {
 * //     email:true,
 * //     password: "This field is required."
 * // }
 */
function validate(objectOrValue) {
    var rules = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    if (_underscore2.default.isObject(objectOrValue)) {
        var errors = {};
        _underscore2.default.each(objectOrValue, function (value, key) {
            var attributeRules = {};
            if (typeof rules[key] != 'undefined') {
                attributeRules = rules[key];
                var error = validateValue(value, attributeRules, options);
                if (error !== false) {
                    errors[key] = error;
                } else {
                    errors[key] = false;
                }
            }
        });

        return errors;
    } else {
        return validateValue(objectOrValue, rules, options);
    }
}

/**
 * Options that can be passed to [validate()](#validate)
 * @typedef {Object} Options
 * @property {Object} validators - An object containing key/function pairs of the validator name and the function. Built-in validators can be overriden here.
 * @example
 * var options = {
 *     validators:{
 *         customValidator: function(value, options = true){
 *           if(options === true){
 *               if(value === ""){
 *                   return messages['required']
 *               }
 *           }
 *           return true;
 *         },
 *     },
 * };
 * var rules = {
 *     validate:true,
 *     customValidator:true,
 * };
 * validate("example", rules, options);
 */

/**
 * An object containing validation rules.
 * @typedef {Object} Rules
 * @property {Boolean} validate - Required attribute. Must be set to true for any validation to occur.
 * @property {*} rules - Key/value pairs of the validator name and the options to pass to the validator.
 * @example
 * var rules = {
 *     validate:true,
 *     email:true,
 * };
 * validate("example", rules); //returns with an error message
 * validate("example@example.com", rules); //returns true
 */

/**
 * A function that validates a given value.
 * @typedef {Function} Validator
 * @param {*} value - The value to validate.
 * @param {*} options - The options specific to this validator. This will usually be a boolean of true, but a more descriptive object can be used.
 * @returns {String|Boolean} - If the value passes the validator, a boolean of true will be returned. If the value did not pass the validator, a boolean of false or a string containing an error message will be returned. 
 */

/**
 * Contains built-in error messages.
 * @module messages
 */
var messages = exports.messages = {
    error: "There are errors in the form. Please go back and fix the highlighted fields.",
    required: "This field is required.",
    email: "Must be a valid email.",
    matches: "The value does not match allowed values.",
    generic: "This value is invalid.",
    simpleString: "Spaces and special characters are not allowed. Only combinations of alphanumeric characters, underscores(_), and hyphens(-) are valid.",
    creditcard: "Please enter a valid credit card number",
    numbersonly: "Please enter only numbers.",
    zipcode: "Please enter a valid zip code."
};

/**
 * Contains built-in validator functions.
 * @module validators
 */
var validators = exports.validators = {

    /**
     * The value must not be empty.
     * @type {Validator}
     * @param  {*}  value   [description]
     * @param  {Boolean} options
     * @returns {Boolean|String}
     */
    required: function required(value) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

        if (options === true) {
            if (value === "") {
                return messages['required'];
            }
        }
        return false;
    },

    /**
     * The value must be an email.
     * @type {Validator}
     * @param  {*}  value   [description]
     * @param  {Boolean} options
     * @returns {Boolean|String}
     */
    email: function email(value) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

        if (options === true) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(value) ? false : messages['email'];
        }
        return false;
    },

    /**
     * 
     */
    creditcard: function creditcard(value) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

        value = value.replace(/\W+/g, '');
        if (typeof value !== 'string' || value.length < 12 || value.length > 19) {
            return messages['creditcard'];
        }
        if (luhnChk(value)) {
            return false;
        } else {
            return messages['creditcard'];
        }
    },

    pattern: function pattern(value, options) {
        if (typeof options === 'string') {
            options = { placeholder: options, mask: options };
        }
        var mask = new _inputmaskCore2.default({ pattern: options.mask });
        mask.input(value);
        if (mask.input(value)) {
            return false;
        } else {
            return 'Please match the pattern ' + (options.placeholder || options.mask);
        }
    },

    numbersonly: function numbersonly(value, options) {
        value = value.toString();
        if (/^\d+$/.test(value)) {
            return false;
        } else {
            return messages['numbersonly'];
        }
    },

    zipcode: function zipcode(value, options) {
        if (/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(value)) {
            return false;
        } else {
            return messages['zipcode'];
        }
    }

};

function validateValue(value, rules) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];


    var error = false;
    options.validators = options.validators || {};

    _underscore2.default.each(rules, function (ruleOpts, ruleName) {
        var validator;
        if (_underscore2.default.isFunction(ruleOpts)) {
            validator = ruleOpts;
            ruleOpts = {};
        } else {
            validator = options.validators[ruleName] || validators[ruleName];
        }

        if (error == false && _underscore2.default.isFunction(validator)) {
            if (rules.required === true || rules.required !== true && value !== "") {
                error = validator(value, ruleOpts);
            }
        }
    });

    return error;
}

function recursiveValidate(nestedValues, nestedRules, options) {
    var errors = {};
    var hadRules = false;
    _underscore2.default.each(nestedRules, function (rules, ruleKey) {
        if (rules.validate === true) {
            hadRules = true;
            var error = validateValue(nestedValues[ruleKey], rules, options);
            if (error !== false) {
                errors[ruleKey] = error;
            }
        } else {
            //errors.errors = recursiveValidate(value, rules, options);
        }
    });
    console.log(errors);
    return errors;
}

function rules(obj) {
    return Object.assign({}, obj, {
        _validate: true
    });
}

/**
 * Luhn algorithm in JavaScript: validate credit card number supplied as string of numbers
 * @author ShirtlessKirk. Copyright (c) 2012.
 * @license WTFPL (http://www.wtfpl.net/txt/copying)
 */
var luhnChk = function (arr) {
    return function (ccNum) {
        var len = ccNum.length,
            bit = 1,
            sum = 0,
            val;

        while (len) {
            val = parseInt(ccNum.charAt(--len), 10);
            sum += (bit ^= 1) ? arr[val] : val;
        }

        return sum && sum % 10 === 0;
    };
}([0, 2, 4, 6, 8, 1, 3, 5, 7, 9]);