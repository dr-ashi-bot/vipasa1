import { DataSource } from 'typeorm';
import { seedConcepts } from './seed-concepts';
import { UserProfileEntity } from '../modules/user/entities/user-profile.entity';
import { ConceptEntity } from '../modules/progress/entities/concept.entity';
import { BKTMasteryEntity } from '../modules/progress/entities/bkt-mastery.entity';
import { LearningSessionEntity } from '../modules/session/entities/learning-session.entity';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'adaptive_learning',
    entities: [UserProfileEntity, ConceptEntity, BKTMasteryEntity, LearningSessionEntity],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('🔗 Database connected');

    await seedConcepts(dataSource);

    await dataSource.destroy();
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
