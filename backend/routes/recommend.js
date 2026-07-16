const express = require('express');
const router = express.Router();
const db = require('../db');

// AI goal inference logic
function inferGoal(bmi, age, gender) {
  if (bmi < 18.5) {
    return 'muscle_gain';
  } else if (bmi >= 18.5 && bmi < 24.9) {
    if (age < 30) return 'muscle_gain';
    return 'maintenance';
  } else {
    return 'weight_loss';
  }
}

// Daily macro targets based on bodyweight
function calculateMacros(weightKg, goal) {
  const proteinPerKg = 1.5;
  const fatFixed = 60;
  const carbMultiplier = { weight_loss: 2, muscle_gain: 4, maintenance: 3 };

  const protein = Math.round(weightKg * proteinPerKg);
  const carbs = Math.round(weightKg * carbMultiplier[goal]);
  const fat = fatFixed;
  const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);

  return { protein, carbs, fat, calories };
}

// Fixed breakfast contributes a set amount of macros regardless of weight/goal
const BREAKFAST = {
  text: 'Oatmeal 40g + 2 boiled eggs + walnuts 15g (healthy fats)',
  protein: 21, // approx grams contributed
  carbs: 29,
  fat: 24
};

// Convert remaining protein/carb/fat targets into grams of real food for lunch + dinner combined
function buildMealPlan(macros) {
  // Subtract breakfast's contribution, floor at a sensible minimum
  const remainingProtein = Math.max(macros.protein - BREAKFAST.protein, 20);
  const remainingCarbs = Math.max(macros.carbs - BREAKFAST.carbs, 40);
  const remainingFat = Math.max(macros.fat - BREAKFAST.fat, 10);

  // Split evenly across lunch + dinner
  const proteinPerMeal = remainingProtein / 2;
  const carbsPerMeal = remainingCarbs / 2;
  const oilPerMeal = Math.round((remainingFat / 2));

  // Protein source options (grams needed to hit proteinPerMeal), based on protein per 100g cooked
  const chickenG = Math.round((proteinPerMeal / 31) * 100);
  const beefG = Math.round((proteinPerMeal / 26) * 100);
  const fishG = Math.round((proteinPerMeal / 22) * 100);

  // Rice (cooked) — approx 28g carbs per 100g cooked rice
  const riceG = Math.round((carbsPerMeal / 28) * 100);

  const mealLine = `Chicken breast ${chickenG}g (or Beef ${beefG}g / Fish ${fishG}g) + Rice ${riceG}g (cooked) + Stir-fried vegetables 150g + Cooking oil ~${oilPerMeal}g`;

  return `Breakfast: ${BREAKFAST.text}
Lunch: ${mealLine}
Dinner: ${mealLine}
Daily Target: Protein ${macros.protein}g | Carbs ${macros.carbs}g | Fat ${macros.fat}g | Calories ~${macros.calories}kcal`;
}

// Get recommendation
router.post('/', async (req, res) => {
  const { user_id, weight_kg, height_cm, age, gender } = req.body;
  const bmi = parseFloat((weight_kg / ((height_cm / 100) ** 2)).toFixed(1));
  const goal = inferGoal(bmi, age, gender);
  const macros = calculateMacros(weight_kg, goal);
  const mealPlanText = buildMealPlan(macros);

  try {
    const [plans] = await db.query(
      'SELECT f.exercise_details FROM PLAN p LEFT JOIN FITNESS_PLAN f ON p.plan_id = f.plan_id WHERE p.goal_type = ? LIMIT 1',
      [goal]
    );
    const exerciseDetails = plans.length > 0 ? plans[0].exercise_details : 'No fitness plan found.';
    const rec_date = new Date().toISOString().split('T')[0];

    await db.query(
      'INSERT INTO RECOMMENDATION (user_id, plan_id, rec_date) VALUES (?, (SELECT plan_id FROM PLAN WHERE goal_type = ? LIMIT 1), ?)',
      [user_id, goal, rec_date]
    );

    res.json({
      bmi,
      goal,
      macros,
      plan: {
        plan_name: `${goal.replace('_', ' ').toUpperCase()} Plan (Personalized)`,
        meal_details: mealPlanText,
        exercise_details: exerciseDetails
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;