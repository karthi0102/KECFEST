const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});
const Joi = BaseJoi.extend(extension)
module.exports.clubSchema= Joi.object({
    clubs:Joi.object({
        title:Joi.string().required().escapeHTML(),
        description:Joi.string().required().escapeHTML(),
        facultyName:Joi.string().required().escapeHTML(),
        facultyNumber:Joi.number().required(),
        facultyMail:Joi.string().required().escapeHTML(),
        studentName:Joi.string().required().escapeHTML(),
        studentNumber:Joi.number().required(),
        studentMail:Joi.string().required().escapeHTML(),
        flink:Joi.string().required().escapeHTML(),
        ilink:Joi.string().required().escapeHTML(),
    }).required()  
})

module.exports.sympSchema=Joi.object({
    symp:Joi.object({
        title:Joi.string().required().escapeHTML(),
        description:Joi.string().required().escapeHTML(),
        mode:Joi.string().required(),
        duration:Joi.string().required().escapeHTML(),
    }).required()
})
