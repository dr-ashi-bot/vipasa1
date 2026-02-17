import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ContentService } from './content.service';

class GenerateContentDto {
  user_id: string;
  concept_id: string;
}

class SocraticFeedbackDto {
  user_id: string;
  concept_id: string;
  user_answer: string;
  correct_answer: string;
  question: string;
}

@ApiTags('content')
@Controller('api/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate personalized learning content via RAG pipeline',
  })
  @ApiBody({ type: GenerateContentDto })
  async generateContent(@Body() body: GenerateContentDto) {
    return this.contentService.generateContent(body.user_id, body.concept_id);
  }

  @Post('socratic-feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Socratic guiding question after incorrect answer',
  })
  @ApiBody({ type: SocraticFeedbackDto })
  async getSocraticFeedback(@Body() body: SocraticFeedbackDto) {
    return this.contentService.generateSocraticResponse(
      body.user_id,
      body.concept_id,
      body.user_answer,
      body.correct_answer,
      body.question,
    );
  }
}
