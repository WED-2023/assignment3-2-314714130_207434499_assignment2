var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const axios = require("axios");
require("dotenv").config();

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


// === search ===
router.get("/search", async (req, res, next) => {
  try {
    const username = req.session?.username;
    const { query, cuisine, diet, intolerances,number } = req.query;
    req.session.lastSearchQuery = { query, cuisine, diet, intolerances, };

    const spoonacularResponse = await recipes_utils.searchRecipes({
      query,
      cuisine,
      diet,
      intolerances,
      number: Number(number) || 5,
    });

    // Validate response
    if (
      !spoonacularResponse ||
      !spoonacularResponse.results ||
      !Array.isArray(spoonacularResponse.results)
    ) {
      throw { status: 500, message: "Invalid response from Spoonacular API" };
    }

    // Return basic preview 
    const previewResults = spoonacularResponse.results.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      popularity: recipe.aggregateLikes,
      vegan: recipe.vegan,
      vegetarian: recipe.vegetarian,
      glutenFree: recipe.glutenFree,
      
    }));

    res.status(200).send(previewResults);
  } catch (error) {
    next(error);
  }
});

// ===  last search  ===
router.get("/lastSearch", (req, res, next) => {
  try {
    const lastQuery = req.session.lastSearchQuery;

    if (!lastQuery) {
      throw { status: 404, message: "No previous search found for this user" };
    }

    res.status(200).send(lastQuery);
  } catch (error) {
    next(error);
  }
});







module.exports = router;
