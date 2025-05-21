var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/details/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

// === preview ===
router.get("/preview/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getPreview(
      req.params.recipeId,
      req.session?.username
    );
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

// === 3 random recepies ===
router.get("/random", async (req, res, next) => {
  try {
    const randomRecipes = await recipes_utils.getRandomRecipes(3);
    res.status(200).send(randomRecipes);
  } catch (error) {
    next(error);
  }
});



module.exports = router;
