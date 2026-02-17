import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { GenerateContentDto } from './dto/generate-content.dto';

@ApiTags('Content')
@Controller('api/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * POST /api/content/generate
   * Triggers the LLM with context injected from the Vector DB.
   */
  @Post('generate')
  @ApiOperation({
    summary: 'Generate personalized learning content via RAG pipeline',
    description:
      'Uses Retrieval-Augmented Generation with Vector DB long-term memory. ' +
      'Injects user name, interests, and past mistakes into prompt. ' +
      'If previous_answer is provided, returns Socratic follow-up instead of new content.',
  })
  @ApiResponse({
    status: 201,
    description: 'Generated personalized content with story narrative',
  })
  async generateContent(@Body() dto: GenerateContentDto) {
    return this.contentService.generateContent(dto);
  }
}
