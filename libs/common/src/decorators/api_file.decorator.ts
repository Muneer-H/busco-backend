import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

interface ApiFileOptions {
  fieldName?: string;
  description?: string;
  required?: boolean;
  additionalRequiredFields?: string[];
  extraFields?: Record<string, SchemaObject>;
  multerOptions: MulterOptions;
  isArray?: boolean;
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
  } = options;

  const properties: Record<string, SchemaObject> = {
    [fieldName]: isArray
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
        },
    ...extraFields,
  };

  const requiredFields = [
    ...(required ? [fieldName] : []),
    ...additionalRequiredFields,
  ].filter((value, index, array) => array.indexOf(value) === index);

  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties,
        ...(requiredFields.length ? { required: requiredFields } : {}),
      },
    }),
    UseInterceptors(
      isArray
        ? FilesInterceptor(fieldName, 10, multerOptions)
        : FileInterceptor(fieldName, multerOptions),
    ),
  );
}
