import { FileInterceptor } from '@nestjs/platform-express';
import { OdmService } from './odm.service';
import { OdmGuard } from './odm.guard';
import assert from 'node:assert';
import {
  Post,
  HttpCode,
  UseGuards,
  Controller,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
  UnprocessableEntityException,
} from '@nestjs/common';

@Controller('odm')
export class OdmController {
  constructor(private readonly odmService: OdmService) {}

  @UseGuards(OdmGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('upload')
  uploadODMFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: 10_000,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    assert(this.odmService.validate(file), new UnprocessableEntityException('Invalid ODM file'));
    return this.odmService.sendMessage(file);
  }
}
