var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.username) {
    DButils.execQuery("SELECT username FROM users").then((users) => {
      if (users.find((x) => x.username === req.session.username)) {
        req.username = req.session.username;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const username = req.session.username;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(username,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const username = req.session.username;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(username);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});


async function getRecipeDetails(recipe_id, username) {
  const recipe_info = await getRecipeInformation(recipe_id);
  const {
    id,
    title,
    readyInMinutes,
    image,
    aggregateLikes,
    vegan,
    vegetarian,
    glutenFree
  } = recipe_info.data;

  let wasWatched = false;
  let isFavorite = false;

  if (username) {
    const watched = await DButils.execQuery(
      "SELECT 1 FROM ViewedRecipes WHERE username = ? AND recipe_id = ?",
      [username, recipe_id]
    );
    wasWatched = watched.length > 0;

    const favorite = await DButils.execQuery(
      "SELECT 1 FROM FavoriteRecipes WHERE username = ? AND recipe_id = ?",
      [username, recipe_id]
    );
    isFavorite = favorite.length > 0;

    await DButils.execQuery(
      "INSERT IGNORE INTO ViewedRecipes (username, recipe_id) VALUES (?, ?)",
      [username, recipe_id]
    );
  }

  return {
    id,
    title,
    readyInMinutes,
    image,
    popularity: aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
    wasWatched,
    isFavorite
  };
}

module.exports = {
  getRecipeDetails
};

module.exports = router;
