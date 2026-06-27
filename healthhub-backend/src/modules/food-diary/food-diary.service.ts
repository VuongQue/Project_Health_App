import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FoodLog, MealType } from './entities/food-log.entity';
import { CreateFoodLogDto } from './dto/create-food-log.dto';

@Injectable()
export class FoodDiaryService {
  constructor(
    @InjectRepository(FoodLog)
    private readonly repo: Repository<FoodLog>,
  ) {}

  async create(userId: number, dto: CreateFoodLogDto) {
    const log = this.repo.create({ userId, ...dto });
    return this.repo.save(log);
  }

  async getToday(userId: number) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const logs = await this.repo.find({
      where: { userId, loggedAt: Between(start, end) },
      order: { loggedAt: 'ASC' },
    });

    return this.summarize(logs);
  }

  async getByDate(userId: number, dateStr: string) {
    const date = new Date(dateStr);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const logs = await this.repo.find({
      where: { userId, loggedAt: Between(start, end) },
      order: { loggedAt: 'ASC' },
    });

    return this.summarize(logs);
  }

  async getWeekSummary(userId: number) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);

    const logs = await this.repo.find({
      where: { userId, loggedAt: Between(start, today) },
      order: { loggedAt: 'ASC' },
    });

    const grouped: Record<string, FoodLog[]> = {};
    for (const log of logs) {
      const key = log.loggedAt.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    }

    return Object.entries(grouped).map(([date, items]) => ({
      date,
      totalCalories: items.reduce((s, i) => s + i.calories, 0),
      totalProtein: items.reduce((s, i) => s + (i.protein ?? 0), 0),
      totalCarbs: items.reduce((s, i) => s + (i.carbs ?? 0), 0),
      totalFat: items.reduce((s, i) => s + (i.fat ?? 0), 0),
    }));
  }

  private summarize(logs: FoodLog[]) {
    const meals: Record<string, FoodLog[]> = {
      [MealType.BREAKFAST]: [],
      [MealType.LUNCH]: [],
      [MealType.DINNER]: [],
      [MealType.SNACK]: [],
    };

    for (const log of logs) {
      meals[log.mealType].push(log);
    }

    const totalCalories = logs.reduce((s, l) => s + l.calories, 0);
    const totalProtein = logs.reduce((s, l) => s + (l.protein ?? 0), 0);
    const totalCarbs = logs.reduce((s, l) => s + (l.carbs ?? 0), 0);
    const totalFat = logs.reduce((s, l) => s + (l.fat ?? 0), 0);

    return { meals, totalCalories, totalProtein, totalCarbs, totalFat };
  }

  async getSuggestions(userId: number, dailyGoalCal = 2000) {
    const today = await this.getToday(userId);
    const consumed = (today as any).totalCalories ?? 0;
    const remaining = Math.max(dailyGoalCal - consumed, 0);

    // Static food database — in production replace with a real DB/API
    const foods = [
      { name: 'Chuối', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, emoji: '🍌', category: 'Trái cây' },
      { name: 'Trứng luộc', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, emoji: '🥚', category: 'Protein' },
      { name: 'Ức gà nướng (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6, emoji: '🍗', category: 'Protein' },
      { name: 'Cơm trắng (1 chén)', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, emoji: '🍚', category: 'Tinh bột' },
      { name: 'Sữa chua Hy Lạp', calories: 100, protein: 17, carbs: 6, fat: 0.7, emoji: '🥛', category: 'Sữa' },
      { name: 'Táo', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, emoji: '🍎', category: 'Trái cây' },
      { name: 'Hạnh nhân (30g)', calories: 164, protein: 6, carbs: 6, fat: 14, emoji: '🥜', category: 'Hạt' },
      { name: 'Khoai lang (1 củ)', calories: 130, protein: 2.9, carbs: 30, fat: 0.1, emoji: '🍠', category: 'Tinh bột' },
      { name: 'Cá hồi (100g)', calories: 208, protein: 20, carbs: 0, fat: 13, emoji: '🐟', category: 'Protein' },
      { name: 'Rau bina (100g)', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, emoji: '🥬', category: 'Rau' },
      { name: 'Phô mai cottage', calories: 110, protein: 13, carbs: 3, fat: 5, emoji: '🧀', category: 'Sữa' },
      { name: 'Yến mạch (1 chén)', calories: 154, protein: 5.3, carbs: 28, fat: 2.6, emoji: '🌾', category: 'Tinh bột' },
    ];

    const suggestions = foods
      .filter((f) => f.calories <= remaining + 50)
      .sort((a, b) => {
        // Prioritize protein-dense foods
        const scoreA = a.protein / a.calories;
        const scoreB = b.protein / b.calories;
        return scoreB - scoreA;
      })
      .slice(0, 8);

    return {
      dailyGoalCal,
      consumed,
      remaining,
      suggestions,
    };
  }

  async delete(userId: number, id: number) {
    const log = await this.repo.findOne({ where: { id, userId } });
    if (!log) return { success: false };
    await this.repo.remove(log);
    return { success: true };
  }
}
