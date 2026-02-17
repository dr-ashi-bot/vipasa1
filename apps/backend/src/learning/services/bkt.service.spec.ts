import type { Repository } from "typeorm";
import { BktService } from "./bkt.service";
import { BKTMastery } from "../../entities/bkt-mastery.entity";

describe("BktService", () => {
  const repositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<BKTMastery>;

  const service = new BktService(repositoryMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates new mastery and increases probability for correct answer", async () => {
    const created: BKTMastery = {
      mastery_id: "mastery-1",
      user_id: "7a1c3183-f8f1-489f-a6cb-57f2518da9b7",
      concept_id: "math_6_integer_operations",
      track: "Math",
      probability_known: 0.25,
      slip: 0.1,
      guess: 0.2,
      transition: 0.15,
      created_at: new Date(),
      updated_at: new Date(),
    };

    (repositoryMock.findOne as jest.Mock).mockResolvedValue(null);
    (repositoryMock.create as jest.Mock).mockReturnValue(created);
    (repositoryMock.save as jest.Mock).mockImplementation(async (item: BKTMastery) => item);

    const result = await service.updateMastery(
      created.user_id,
      created.concept_id,
      created.track,
      true,
    );

    expect(result.updated_probability).toBeGreaterThan(result.previous_probability);
    expect(result.updated_probability).toBeLessThanOrEqual(1);
  });

  it("keeps probability bounded after incorrect answer", async () => {
    const existing: BKTMastery = {
      mastery_id: "mastery-2",
      user_id: "7a1c3183-f8f1-489f-a6cb-57f2518da9b7",
      concept_id: "ela_4_main_idea",
      track: "ELA",
      probability_known: 0.6,
      slip: 0.1,
      guess: 0.2,
      transition: 0.15,
      created_at: new Date(),
      updated_at: new Date(),
    };

    (repositoryMock.findOne as jest.Mock).mockResolvedValue(existing);
    (repositoryMock.save as jest.Mock).mockImplementation(async (item: BKTMastery) => item);

    const result = await service.updateMastery(
      existing.user_id,
      existing.concept_id,
      existing.track,
      false,
    );

    expect(result.updated_probability).toBeGreaterThanOrEqual(0);
    expect(result.updated_probability).toBeLessThanOrEqual(1);
  });
});
