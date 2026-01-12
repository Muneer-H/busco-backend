import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { DateTime } from 'luxon';

export function IsValidDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsValidDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Handle null/undefined values
          if (!value) return true;

          // If value is already a Date object (due to enableImplicitConversion)
          if (value instanceof Date) {
            return !Number.isNaN(value.getTime()); // Valid if not NaN
          }

          // If value is a string, validate format
          if (typeof value === 'string') {
            const regEx = /^\d{4}-\d{2}-\d{2}$/;
            if (!value.match(regEx)) return false; // Invalid format

            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return false; // Invalid date

            return d.toISOString().slice(0, 10) === value;
          }

          // If value is neither Date nor string, it's invalid
          return false;
        },
      },
    });
  };
}

export function IsValidTime(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsValidDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Handle null/undefined values
          if (!value) return false;

          // If value is a string, validate format
          if (typeof value === 'string') {
            const regEx = /^\d{2}:\d{2}$/;
            if (!value.match(regEx)) return false; // Invalid format

            return DateTime.fromFormat(value, 'hh:mm').isValid;
          }

          // If value is not a string, it's invalid (time should always be string)
          return false;
        },
      },
    });
  };
}

export function IsDateGreaterThanEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsValidDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          if (!relatedValue) {
            return true;
          }

          return new Date(value) >= new Date(relatedValue);
        },
      },
    });
  };
}
