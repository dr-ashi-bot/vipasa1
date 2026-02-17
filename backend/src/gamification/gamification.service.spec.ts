import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GamificationService } from './gamification.service';
import { GamificationState, League } from '../database/gamification-state.schema';
import { XpEvent } from '../database/xp-event.schema';

describe('GamificationService', () => {
  let service: GamificationService;

  describe('Flow State Design', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          GamificationService,
          {
            provide: getModelToken(GamificationState.name),
            useValue: {
              findOne: jest.fn(),
              create: jest.fn(),
            },
          },
          {
            provide: getModelToken(XpEvent.name),
            useValue: {
              create: jest.fn(),
            },
          },
          {
            provide: EventEmitter2,
            useValue: {
              emit: jest.fn(),
            },
          },
        ],
      }).compile();

      service = module.get<GamificationService>(GamificationService);
    });

    it('should show full confetti for < 5 consecutive correct', () => {
      const flowState = service.calculateFlowState(3);
      expect(flowState.is_in_flow).toBe(false);
      expect(flowState.confetti_opacity).toBe(1.0);
      expect(flowState.confetti_frequency).toBe(1.0);
      expect(flowState.show_confetti).toBe(true);
    });

    it('should enter flow state at exactly 5 consecutive correct', () => {
      const flowState = service.calculateFlowState(5);
      expect(flowState.is_in_flow).toBe(true);
      expect(flowState.confetti_opacity).toBe(1.0);
      expect(flowState.show_confetti).toBe(true);
    });

    it('should gradually fade confetti as flow deepens', () => {
      const flow6 = service.calculateFlowState(6);
      const flow7 = service.calculateFlowState(7);
      const flow8 = service.calculateFlowState(8);

      expect(flow6.confetti_opacity).toBeLessThan(1.0);
      expect(flow7.confetti_opacity).toBeLessThan(flow6.confetti_opacity);
      expect(flow8.confetti_opacity).toBeLessThan(flow7.confetti_opacity);
    });

    it('should never fully hide confetti (minimum opacity)', () => {
      const deepFlow = service.calculateFlowState(20);
      expect(deepFlow.confetti_opacity).toBeGreaterThanOrEqual(0.1);
    });

    it('should reset flow state at 0 consecutive correct', () => {
      const flowState = service.calculateFlowState(0);
      expect(flowState.is_in_flow).toBe(false);
      expect(flowState.confetti_opacity).toBe(1.0);
      expect(flowState.consecutive_correct).toBe(0);
    });
  });
});
