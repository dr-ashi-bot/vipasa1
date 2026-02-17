import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Adaptive API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/session/start (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/session/start')
      .send({
        user_id: '550e8400-e29b-41d4-a716-446655440002',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toHaveProperty('session_timer');
        expect(response.body).toHaveProperty('optimal_learning_path');
      });
  });
});
