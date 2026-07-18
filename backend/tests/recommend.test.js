// Unit tests for the AI goal-inference and meal-plan logic in routes/recommend.js
// These tests do NOT need the database or the server to be running --
// they call the pure calculation functions directly with known inputs
// and check that the output matches what we expect by hand.
//
// Run with: npm test   (from the backend folder)

const { inferGoal, calculateMacros, buildMealPlan, getBreakfast } = require('../routes/recommend');

describe('inferGoal (AI goal-inference rules)', () => {
  test('BMI below 18.5 should always return muscle_gain', () => {
    expect(inferGoal(17.0, 25, 'male')).toBe('muscle_gain');
    expect(inferGoal(18.4, 60, 'female')).toBe('muscle_gain');
  });

  test('BMI 18.5-24.9 and age under 30 should return muscle_gain', () => {
    expect(inferGoal(22.0, 25, 'male')).toBe('muscle_gain');
  });

  test('BMI 18.5-24.9 and age 30 or above should return maintenance', () => {
    expect(inferGoal(22.0, 30, 'male')).toBe('maintenance');
    expect(inferGoal(24.8, 45, 'female')).toBe('maintenance');
  });

  test('BMI 24.9 or above should always return weight_loss', () => {
    expect(inferGoal(25.0, 22, 'male')).toBe('weight_loss');
    expect(inferGoal(30.5, 50, 'female')).toBe('weight_loss');
  });

  // Boundary case: exactly on the 18.5 line
  test('BMI exactly 18.5 is treated as normal weight, not underweight', () => {
    expect(inferGoal(18.5, 40, 'male')).toBe('maintenance');
  });
});

describe('calculateMacros (macronutrient calculation)', () => {
  test('protein target is 1.5g per kg of bodyweight', () => {
    const result = calculateMacros(60, 'maintenance');
    expect(result.protein).toBe(90); // 60 * 1.5
  });

  test('fat target is always fixed at 60g regardless of goal', () => {
    expect(calculateMacros(60, 'weight_loss').fat).toBe(60);
    expect(calculateMacros(60, 'muscle_gain').fat).toBe(60);
    expect(calculateMacros(60, 'maintenance').fat).toBe(60);
  });

  test('carbs multiplier differs correctly by goal', () => {
    const weightLoss = calculateMacros(60, 'weight_loss');
    const maintenance = calculateMacros(60, 'maintenance');
    const muscleGain = calculateMacros(60, 'muscle_gain');
    expect(weightLoss.carbs).toBe(120);   // 60 * 2
    expect(maintenance.carbs).toBe(180);  // 60 * 3
    expect(muscleGain.carbs).toBe(240);   // 60 * 4
  });

  test('calories are calculated correctly from protein/carbs/fat', () => {
    const result = calculateMacros(60, 'maintenance');
    // protein 90*4 + carbs 180*4 + fat 60*9 = 360 + 720 + 540 = 1620
    expect(result.calories).toBe(1620);
  });
});

describe('getBreakfast (nut-free substitution)', () => {
  test('default breakfast includes walnuts', () => {
    const breakfast = getBreakfast(false);
    expect(breakfast.text).toMatch(/walnuts/i);
  });

  test('nut-free breakfast replaces walnuts with chia seeds', () => {
    const breakfast = getBreakfast(true);
    expect(breakfast.text).toMatch(/chia seeds/i);
    expect(breakfast.text).not.toMatch(/walnuts/i);
  });
});

describe('buildMealPlan (dietary preference substitution)', () => {
  const macros = calculateMacros(60, 'maintenance');

  test('default (non-vegetarian) plan includes chicken/beef/fish as protein sources', () => {
    const plan = buildMealPlan(macros, 'none', false);
    expect(plan).toMatch(/Chicken breast/);
    expect(plan).not.toMatch(/Tofu/);
  });

  test('vegetarian plan replaces meat with plant-based protein sources', () => {
    const plan = buildMealPlan(macros, 'vegetarian', false);
    expect(plan).toMatch(/Tofu/);
    expect(plan).not.toMatch(/Chicken breast/);
  });

  test('nut-free vegetarian plan has both substitutions applied at once', () => {
    const plan = buildMealPlan(macros, 'vegetarian', true);
    expect(plan).toMatch(/Tofu/);
    expect(plan).toMatch(/chia seeds/i);
    expect(plan).not.toMatch(/walnuts/i);
    expect(plan).not.toMatch(/Chicken breast/);
  });

  test('meal plan text always includes the daily macro target summary', () => {
    const plan = buildMealPlan(macros, 'none', false);
    expect(plan).toMatch(/Daily Target:/);
  });
});