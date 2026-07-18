const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

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

// NEW: breakfast now depends on nut_free preference
function getBreakfast(nutFree) {
  if (nutFree) {
    // Chia seeds replace walnuts as the healthy-fat source
    return {
      text: 'Oatmeal 40g + 2 boiled eggs + chia seeds 15g (nut-free healthy fats)',
      protein: 20,
      carbs: 30,
      fat: 22
    };
  }
  return {
    text: 'Oatmeal 40g + 2 boiled eggs + walnuts 15g (healthy fats)',
    protein: 21,
    carbs: 29,
    fat: 24
  };
}

// Convert remaining protein/carb/fat targets into grams of real food for lunch + dinner combined
// NEW: dietaryPreference switches the protein source between meat and plant-based options
function buildMealPlan(macros, dietaryPreference, nutFree) {
  const breakfast = getBreakfast(nutFree);

  const remainingProtein = Math.max(macros.protein - breakfast.protein, 20);
  const remainingCarbs = Math.max(macros.carbs - breakfast.carbs, 40);
  const remainingFat = Math.max(macros.fat - breakfast.fat, 10);

  const proteinPerMeal = remainingProtein / 2;
  const carbsPerMeal = remainingCarbs / 2;
  const oilPerMeal = Math.round((remainingFat / 2));

  // Rice (cooked) — approx 28g carbs per 100g cooked rice
  const riceG = Math.round((carbsPerMeal / 28) * 100);

  let proteinLine;
  if (dietaryPreference === 'vegetarian') {
    // Plant-based protein sources (grams needed to hit proteinPerMeal), based on protein per 100g cooked
    const tofuG = Math.round((proteinPerMeal / 12) * 100);
    const tempehG = Math.round((proteinPerMeal / 19) * 100);
    const lentilsG = Math.round((proteinPerMeal / 9) * 100);
    proteinLine = `Tofu ${tofuG}g (or Tempeh ${tempehG}g / Cooked Lentils ${lentilsG}g)`;
  } else {
    // Animal-based protein sources
    const chickenG = Math.round((proteinPerMeal / 31) * 100);
    const beefG = Math.round((proteinPerMeal / 26) * 100);
    const fishG = Math.round((proteinPerMeal / 22) * 100);
    proteinLine = `Chicken breast ${chickenG}g (or Beef ${beefG}g / Fish ${fishG}g)`;
  }

  const mealLine = `${proteinLine} + Rice ${riceG}g (cooked) + Stir-fried vegetables 150g + Cooking oil ~${oilPerMeal}g`;

  return `Breakfast: ${breakfast.text}
Lunch: ${mealLine}
Dinner: ${mealLine}
Daily Target: Protein ${macros.protein}g | Carbs ${macros.carbs}g | Fat ${macros.fat}g | Calories ~${macros.calories}kcal`;
}

// Get recommendation
router.post('/', verifyToken, async (req, res) => {
  const { user_id, weight_kg, height_cm, age, gender } = req.body;
  const bmi = parseFloat((weight_kg / ((height_cm / 100) ** 2)).toFixed(1));
  const goal = inferGoal(bmi, age, gender);
  const macros = calculateMacros(weight_kg, goal);

  try {
    // NEW: look up the user's saved dietary preferences
    const [userRows] = await db.query(
      'SELECT dietary_preference, nut_free FROM USER WHERE user_id = ?',
      [user_id]
    );
    const dietaryPreference = userRows.length > 0 ? userRows[0].dietary_preference : 'none';
    const nutFree = userRows.length > 0 ? !!userRows[0].nut_free : false;

    const mealPlanText = buildMealPlan(macros, dietaryPreference, nutFree);

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

// NEW: export the pure calculation functions so they can be tested directly
// without needing the database or a running server (see recommend.test.js)
module.exports = router;
module.exports.inferGoal = inferGoal;
module.exports.calculateMacros = calculateMacros;
module.exports.buildMealPlan = buildMealPlan;
module.exports.getBreakfast = getBreakfast;