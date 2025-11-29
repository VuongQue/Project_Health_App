import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import type { File as MulterFile } from 'multer';

@Controller('media')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: any) {
    if (!file) {
      console.log("❌ Multer did NOT receive file");
    } else {
      console.log("📥 Multer received:", file);
    }

    return this.cloudinaryService.uploadImage(file);
}
}
