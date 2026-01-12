import multer from 'multer';
import multerS3 from 'multer-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { AllowedMimesTypes } from '@app/common/constants/allowed_mimes_types.constant';
import { appEnv } from './env.helper';
import { MulterModuleOptions } from '@nestjs/platform-express';
import { S3Prefix } from '../enums/s3_prefix.enum';

const s3 = new S3Client({
  region: appEnv('AWS_REGION', 'us-east-1'),
  credentials: {
    secretAccessKey: appEnv('AWS_SECRET_ACCESS_KEY'),
    accessKeyId: appEnv('AWS_ACCESS_KEY_ID'),
  },
});

function myFilter(mimeTypes: string[]) {
  return (_: Request, file: any, cb: multer.FileFilterCallback) => {
    if (mimeTypes.indexOf(file.mimetype) === -1) {
      return cb(
        new BadRequestException(
          `Uploaded file type is not supported. ${file.mimetype}`,
        ),
      );
    }
    cb(null, true);
  };
}

const limits = {
  fieldNameSize: 255,
  fieldSize: 1024 * 1024 * 20,
  fileSize: 1024 * 1024 * 20,
};

const multerObj = (
  prefix: S3Prefix,
  mimeTypes = AllowedMimesTypes,
  isPublic = false,
): MulterModuleOptions => ({
  storage: multerS3({
    s3: s3,
    bucket: appEnv('AWS_S3_BUCKET'),
    acl: isPublic ? 'public-read' : undefined,
    key: function (_: Request, file, cb) {
      const fileName = file.originalname.replace(/[^A-Z0-9/.]/gi, '_');
      const awsFileName = `${prefix}/${Date.now().toString()}_${fileName}`;
      cb(null, awsFileName);
    },
  }),
  fileFilter: myFilter(mimeTypes),
  limits,
});
export function DeleteAWSFile(fileName) {
  const command = new DeleteObjectCommand({
    Bucket: appEnv('AWS_S3_BUCKET'),
    Key: fileName,
  });

  return s3.send(command);
}

export async function UploadFileToS3(stream, key) {
  return new Upload({
    client: s3,
    params: {
      Bucket: appEnv('AWS_S3_BUCKET'),
      // ACL: 'public-read',
      Body: stream,
      Key: key,
    },
  }).done();
}

export function GetAWSSignedUrl(
  key: string,
  expires = null,
): Promise<string> | string {
  // check if key is s3 url
  if (!key?.includes('amazonaws.com')) {
    return key;
  }

  key = GetFileKey(key);

  const param: GetObjectCommandInput = {
    Bucket: appEnv('AWS_S3_BUCKET'),
    Key: key.replace(/^\/+/g, ''),
  };

  const expiresIn = expires || +appEnv('AWS_S3_SIGNED_URL_EXPIRATION');
  return getSignedUrl(s3, new GetObjectCommand(param), { expiresIn });
}
function GetFileKey(path: string) {
  const key = path.substring(path.lastIndexOf('.com/') + 5);
  return key;
}

export { multerObj };
