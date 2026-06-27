import { BadRequestException, Controller, Logger, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('media')
export class CloudinaryController {
  private readonly logger = new Logger(CloudinaryController.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: any) {
    if (!file) {
      this.logger.warn('Upload called but no file received from multer');
      throw new BadRequestException('No file uploaded');
    }
    this.logger.debug(`Upload received: ${file.originalname} (${file.size} bytes)`);
    return this.cloudinaryService.uploadImage(file);
  }
}
