import { Body, Controller, Post } from '@nestjs/common';
import { GenerateContentDto } from './dto/generate-content.dto';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateContentDto) {
    return await this.content.generate(dto);
  }
}

