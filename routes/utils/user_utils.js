const DButils = require("./DButils");

async function markAsFavorite(username, recipe_id){
    await DButils.execQuery(`insert into users_favorite values ('${username}',${recipe_id})`);
}

async function getFavoriteRecipes(username){
    const recipes_id = await DButils.execQuery(`select recipe_id from users_favorite where username='${username}'`);
    return recipes_id;
}


async function createRecipe({
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
}) {
  // Insert recipe metadata
  const insertRecipeQuery = `
    INSERT INTO recipes
    (username,title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree, instructions )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await DButils.execQuery(insertRecipeQuery, [
    username,
    title,
    image,
    readyInMinutes,
    popularity,
    vegan,
    vegetarian,
    glutenFree,
    instructions,
    
  ]);
  const recipe_id = result.insertId;

  // Insert ingredients
  for (const ing of ingredients) {
    await DButils.execQuery(
      `INSERT INTO recipe_ingredients (recipe_id, name, quantity) VALUES (?, ?, ?)`,
      [recipe_id, ing.name, ing.quantity]
    );
  }

  return recipe_id;
}


async function getUserCreatedRecipePreviews(username) {
  const query = `
    SELECT r.id, r.title, r.image, r.readyInMinutes, r.popularity,
           r.vegan, r.vegetarian, r.glutenFree,
           vr.recipe_id IS NOT NULL AS wasWatched
    FROM recipes r
    LEFT JOIN viewed_selfcreated_recipes vr
      ON r.id = vr.recipe_id AND vr.username = ?
    WHERE r.username = ?
  `;

  const result = await DButils.execQuery(query, [username, username]);

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    image: row.image,
    readyInMinutes: row.readyInMinutes,
    popularity: row.popularity,
    vegan: !!row.vegan,
    vegetarian: !!row.vegetarian,
    glutenFree: !!row.glutenFree,
    wasWatched: !!row.wasWatched,
  }));
}

exports.getUserCreatedRecipePreviews = getUserCreatedRecipePreviews;
exports.createRecipe = createRecipe;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
