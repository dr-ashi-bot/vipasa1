import { Body, Controller, Post } from '@nestjs/common';
import { ContentService } from './content.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MemoryService } from '../memory/memory.service';

class GenerateContentDto {
  user_id: string;
  concept_id: string;
  track: 'math' | 'ela';
  part_index?: number;
}

@Controller('api/content')
export class ContentController {
  constructor(
    private contentService: ContentService,
    private memoryService: MemoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post('generate')
  async generate(@Body() dto: GenerateContentDto) {
    const result = await this.contentService.generateContent(
      dto.user_id,
      dto.concept_id,
      dto.track,
      dto.part_index,
    );
    return result;
  }

  @Post('socratic-question')
  async getSocraticQuestion(
    @Body()
    dto: {
      user_id: string;
      concept_id: string;
      user_answer: string;
      problem: string;
    },
  ) {
    const question = await this.contentService.getSocraticQuestion(
      dto.user_id,
      dto.concept_id,
      dto.user_answer,
      dto.problem,
    );
    return { question };
  }
}
