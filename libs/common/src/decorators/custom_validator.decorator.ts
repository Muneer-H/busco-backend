import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * A flexible custom validator that accepts a callback function for validation logic
 * @param validationFn - Function that takes the value and returns true if valid, false if invalid
 * @param message - Optional custom error message. If not provided, a default message will be used
 * @param validationOptions - Standard class-validator options
 */
export function CustomValidator(
  validationFn: (value: any, args?: ValidationArguments) => boolean,
  message?: string | ((args: ValidationArguments) => string),
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'CustomValidator',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return validationFn(value, args);
        },
        defaultMessage(args: ValidationArguments) {
          if (typeof message === 'function') {
            return message(args);
          }
          if (typeof message === 'string') {
            return message;
          }
          return `${args.property} failed custom validation`;
        },
      },
    });
  };
}
