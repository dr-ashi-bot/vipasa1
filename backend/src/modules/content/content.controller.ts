import { Controller, Post, Body } from '@nestjs/common';
import { ContentService, GenerateContentDto } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('generate')
  async generateContent(@Body() dto: GenerateContentDto) {
    return this.contentService.generateContent(dto);
  }

  @Post('feedback')
  async generateFeedback(
    @Body()
    data: {
      user_id: string;
      concept_id: string;
      user_answer: string;
      correct_answer: string;
    },
  ) {
    return this.contentService.generateSocraticFeedback(
      data.user_id,
      data.concept_id,
      data.user_answer,
      data.correct_answer,
    );
  }
}
