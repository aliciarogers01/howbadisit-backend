const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Temporary in-memory storage
let foods = [];
let foodLogs = [];

// Health score function: 1 = good, 100 = horrible
function calculateBadnessScore(food, servingsEaten) {
  const calories = food.calories * servingsEaten;
  const saturatedFat = food.saturatedFat * servingsEaten;
  const transFat = food.transFat * servingsEaten;
  const sodium = food.sodium * servingsEaten;
  const cholesterol = food.cholesterol * servingsEaten;
  const protein = food.protein * servingsEaten;

  let score = 1;

  score += Math.min(15, calories / 100);
  score += Math.min(25, saturatedFat * 1.5);
  score += Math.min(20, transFat * 10);
  score += Math.min(25, sodium / 100);
  score += Math.min(10, cholesterol / 30);
  score -= Math.min(10, protein / 10);

  score = Math.round(Math.max(1, Math.min(100, score)));

  return score;
}

function getScoreLabel(score) {
  if (score <= 20) return "Pretty good";
  if (score <= 40) return "Not bad";
  if (score <= 60) return "Kinda bad";
  if (score <= 80) return "Bad";
  return "Horrible";
}

app.get("/", (req, res) => {
  res.json({
    app: "How Bad Is It Really?",
    status: "Backend is running"
  });
});

// Add a food
app.post("/foods", (req, res) => {
  const food = {
    id: foods.length + 1,
    brand: req.body.brand,
    name: req.body.name,
    type: req.body.type,
    servingSize: req.body.servingSize,
    calories: Number(req.body.calories),
    totalFat: Number(req.body.totalFat),
    saturatedFat: Number(req.body.saturatedFat),
    transFat: Number(req.body.transFat),
    cholesterol: Number(req.body.cholesterol),
    sodium: Number(req.body.sodium),
    protein: Number(req.body.protein),
    createdAt: new Date()
  };

  foods.push(food);
  res.status(201).json(food);
});

// Get all foods
app.get("/foods", (req, res) => {
  res.json(foods);
});

// Log food eaten
app.post("/food-logs", (req, res) => {
  const food = foods.find(f => f.id === Number(req.body.foodId));

  if (!food) {
    return res.status(404).json({ error: "Food not found" });
  }

  const servingsEaten = Number(req.body.servingsEaten);
  const badnessScore = calculateBadnessScore(food, servingsEaten);

  const log = {
    id: foodLogs.length + 1,
    foodId: food.id,
    foodName: `${food.brand} ${food.name}`,
    servingsEaten,
    totals: {
      calories: food.calories * servingsEaten,
      totalFat: food.totalFat * servingsEaten,
      saturatedFat: food.saturatedFat * servingsEaten,
      transFat: food.transFat * servingsEaten,
      cholesterol: food.cholesterol * servingsEaten,
      sodium: food.sodium * servingsEaten,
      protein: food.protein * servingsEaten
    },
    badnessScore,
    scoreLabel: getScoreLabel(badnessScore),
    createdAt: new Date()
  };

  foodLogs.push(log);
  res.status(201).json(log);
});

// Get food logs
app.get("/food-logs", (req, res) => {
  res.json(foodLogs);
});

// Compare two foods
app.get("/compare/:foodAId/:foodBId", (req, res) => {
  const foodA = foods.find(f => f.id === Number(req.params.foodAId));
  const foodB = foods.find(f => f.id === Number(req.params.foodBId));

  if (!foodA || !foodB) {
    return res.status(404).json({ error: "One or both foods not found" });
  }

  res.json({
    foodA,
    foodB,
    comparison: {
      calories: foodA.calories < foodB.calories ? foodA.name : foodB.name,
      saturatedFat: foodA.saturatedFat < foodB.saturatedFat ? foodA.name : foodB.name,
      sodium: foodA.sodium < foodB.sodium ? foodA.name : foodB.name,
      protein: foodA.protein > foodB.protein ? foodA.name : foodB.name
    }
  });
});

app.listen(PORT, () => {
  console.log(`How Bad Is It Really backend running on port ${PORT}`);
});
