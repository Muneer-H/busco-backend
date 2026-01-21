import { applyDecorators, UseInterceptors } from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type {
  SchemaObject,
  ReferenceObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

interface ApiFileField {
  name: string;
  maxCount?: number;
  description?: string;
  required?: boolean;
}

interface ApiFileOptions {
  fieldName?: string;
  description?: string;
  required?: boolean;
  additionalRequiredFields?: string[];
  extraFields?: Record<string, SchemaObject | ReferenceObject>;
  multerOptions: MulterOptions;
  isArray?: boolean;
  fields?: ApiFileField[];
}

export function ApiFile(options: ApiFileOptions): MethodDecorator {
  const {
    fieldName = 'file',
    description,
    required = true,
    additionalRequiredFields = [],
    extraFields = {},
    multerOptions,
    isArray = false,
    fields,
  } = options;

  const properties: Record<string, SchemaObject | ReferenceObject> = {
    ...extraFields,
  };

  if (fields) {
    fields.forEach((field) => {
      properties[field.name] =
        field.maxCount && field.maxCount > 1
          ? {
              type: 'array',
              items: {
                type: 'string',
                format: 'binary',
              },
              description: field.description,
            }
          : {
              type: 'string',
              format: 'binary',
              description: field.description,
            };
    });
  } else {
    properties[fieldName] = isArray
      ? {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description,
        }
      : {
          type: 'string',
          format: 'binary',
          description,
        };
  }

  const requiredFields = [
    ...additionalRequiredFields,
    ...(fields
      ? fields.filter((f) => f.required).map((f) => f.name)
      : required
        ? [fieldName]
        : []),
  ].filter((value, index, array) => array.indexOf(value) === index);

  let interceptor;
  if (fields) {
    interceptor = FileFieldsInterceptor(
      fields.map((f) => ({ name: f.name, maxCount: f.maxCount })),
      multerOptions,
    );
  } else if (isArray) {
    interceptor = FilesInterceptor(fieldName, 10, multerOptions);
  } else {
    interceptor = FileInterceptor(fieldName, multerOptions);
  }

  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties,
        ...(requiredFields.length ? { required: requiredFields } : {}),
      },
    }),
    UseInterceptors(interceptor),
  );
}
