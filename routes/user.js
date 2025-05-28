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


// === last 3 recepies viewed for the current user ===
router.get("/lastViewed", async (req, res, next) => {
  try {
    const username = req.session.username;
    if (!username) throw { status: 401, message: "Unauthorized" };

    // Get up to 3 most recently viewed recipe IDs
    const results = await DButils.execQuery(
      `SELECT recipe_id
       FROM viewed_recipes
       WHERE username = ?
       ORDER BY viewed_at DESC
       LIMIT 3`,
      [username]
    );

    const recipeIds = results.map(r => r.recipe_id);

    // Fetch preview data for each
    const previewPromises = recipeIds.map(id =>
      recipe_utils.getPreview(id, username)
    );

    const previews = await Promise.all(previewPromises);

    res.status(200).send(previews);
  } catch (error) {
    next(error);
  }
});

// === mark recipe as viewed ===
router.post("/viewed", async (req, res, next) => {
  try {
    const username = req.session?.username;
    if (!username) throw { status: 401, message: "Unauthorized" };

    const { recipeId } = req.body;
    if (!recipeId) throw { status: 400, message: "Missing recipeId" };

    // if the recipe_id exist, update just the timestamp
    await DButils.execQuery(
      `INSERT INTO viewed_recipes (username, recipe_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP`,
      [username, recipeId]
    );

    res.status(201).send({ success: true, message: "Recipe marked as viewed" });
  } catch (error) {
    next(error);
  }
});


// === create recipe ===
router.post("/create", async (req, res, next) => {
  try {
    const username = req.session?.username;
    if (!username) throw { status: 401, message: "Unauthorized" };

    const {
      title,
      image,
      readyInMinutes,
      popularity,
      vegan,
      vegetarian,
      glutenFree,
      instructions,
      ingredients,
    } = req.body;

    const recipe_id = await user_utils.createRecipe({
      title,
      image,
      readyInMinutes,
      popularity,
      vegan,
      vegetarian,
      glutenFree,
      instructions,
      ingredients,
      username,
    });

    res.status(201).send({ success: true, recipe_id });
  } catch (err) {
    next(err);
  }
});



// === view my own recipes ===
router.get("/myRecipes", async (req, res, next) => {
  try {
    const username = req.session?.username;
    if (!username) throw { status: 401, message: "Unauthorized" };

    const recipes = await user_utils.getUserCreatedRecipePreviews(username);
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
}); 

// === mark self created recipe as viewed ===
router.post("/selfcreatedviewed", async (req, res, next) => {
  try {
    const username = req.session?.username;
    if (!username) throw { status: 401, message: "Unauthorized" };

    const { recipeId } = req.body;
    if (!recipeId) throw { status: 400, message: "Missing recipeId" };

    // if the recipe_id exist, update just the timestamp
    await DButils.execQuery(
      `INSERT INTO viewed_selfcreated_recipes (username, recipe_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP`,
      [username, recipeId]
    );

    res.status(201).send({ success: true, message: "Recipe marked as viewed" });
  } catch (error) {
    next(error);
  }
});

// === like a recipe ===
router.post("/like", async (req, res, next) => {
  try {
    const username = req.session?.username;
    const { recipe_id } = req.body;

    if (!username) throw { status: 401, message: "Unauthorized" };
    if (!recipe_id) throw { status: 400, message: "Missing recipe_id" };

    await DButils.execQuery(`
      INSERT INTO recipe_likes (recipe_id, username)
      VALUES (${recipe_id}, '${username}')
    `);

    res.status(200).send({ message: "Recipe liked successfully" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).send({ message: "Already liked this recipe" });
    } else {
      next(error);
    }
  }
});
module.exports = router;
