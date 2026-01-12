import { BadRequestException, PipeTransform } from '@nestjs/common';

export class EnsureFileExistsPipe implements PipeTransform {
  transform(file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return file;
  }
}
