import { DataSource } from 'typeorm';
import { ConceptEntity, ConceptDomain } from '../modules/progress/entities/concept.entity';

export async function seedConcepts(dataSource: DataSource) {
  const conceptRepository = dataSource.getRepository(ConceptEntity);

  const concepts: Partial<ConceptEntity>[] = [
    // Math Concepts - Grade 6 (Beast Academy level)
    {
      concept_id: 'math_6_integers_operations',
      domain: ConceptDomain.MATH,
      grade_level: 6,
      name: 'Integer Operations',
      description: 'Adding, subtracting, multiplying, and dividing integers',
      prerequisites: [],
    },
    {
      concept_id: 'math_6_fractions_advanced',
      domain: ConceptDomain.MATH,
      grade_level: 6,
      name: 'Advanced Fractions',
      description: 'Complex fraction operations and word problems',
      prerequisites: [],
    },
    {
      concept_id: 'math_6_geometry_3d',
      domain: ConceptDomain.MATH,
      grade_level: 6,
      name: '3D Geometry',
      description: 'Surface area and volume of 3D solids',
      prerequisites: [],
    },
    {
      concept_id: 'math_6_equations_multistep',
      domain: ConceptDomain.MATH,
      grade_level: 6,
      name: 'Multi-Step Equations',
      description: 'Solving complex equations with multiple steps',
      prerequisites: ['math_6_integers_operations'],
    },
    {
      concept_id: 'math_6_ratios_proportions',
      domain: ConceptDomain.MATH,
      grade_level: 6,
      name: 'Ratios and Proportions',
      description: 'Understanding and applying ratios and proportional relationships',
      prerequisites: ['math_6_fractions_advanced'],
    },
    {
      concept_id: 'math_6_probability',
      domain: ConceptDomain.MATH,
      grade_level: 6,
      name: 'Probability',
      description: 'Introduction to probability and statistics',
      prerequisites: [],
    },

    // ELA Concepts - Grade 4 (Remediation level)
    {
      concept_id: 'ela_4_reading_comprehension',
      domain: ConceptDomain.ELA,
      grade_level: 4,
      name: 'Reading Comprehension',
      description: 'Understanding main ideas and details in text',
      prerequisites: [],
    },
    {
      concept_id: 'ela_4_vocabulary',
      domain: ConceptDomain.ELA,
      grade_level: 4,
      name: 'Vocabulary Building',
      description: 'Learning new words through context',
      prerequisites: [],
    },
    {
      concept_id: 'ela_4_sentence_structure',
      domain: ConceptDomain.ELA,
      grade_level: 4,
      name: 'Sentence Structure',
      description: 'Building clear and complete sentences',
      prerequisites: [],
    },
    {
      concept_id: 'ela_4_paragraph_writing',
      domain: ConceptDomain.ELA,
      grade_level: 4,
      name: 'Paragraph Writing',
      description: 'Writing organized paragraphs with topic sentences',
      prerequisites: ['ela_4_sentence_structure'],
    },
    {
      concept_id: 'ela_4_inference',
      domain: ConceptDomain.ELA,
      grade_level: 4,
      name: 'Making Inferences',
      description: 'Reading between the lines',
      prerequisites: ['ela_4_reading_comprehension'],
    },
    {
      concept_id: 'ela_4_summarizing',
      domain: ConceptDomain.ELA,
      grade_level: 4,
      name: 'Summarizing',
      description: 'Identifying key points and summarizing text',
      prerequisites: ['ela_4_reading_comprehension'],
    },
  ];

  for (const concept of concepts) {
    const existing = await conceptRepository.findOne({
      where: { concept_id: concept.concept_id },
    });

    if (!existing) {
      await conceptRepository.save(conceptRepository.create(concept));
      console.log(`✅ Created concept: ${concept.name}`);
    }
  }

  console.log('🌱 Concept seeding complete!');
}
