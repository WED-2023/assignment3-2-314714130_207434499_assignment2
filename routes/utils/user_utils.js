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
  servings,
  ingredients,
  username
}) {
  // Insert recipe metadata
  const insertRecipeQuery = `
    INSERT INTO recipes 
    (username, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree, instructions, servings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    servings
  ]);

  const recipe_id = result.insertId;

  // Insert each ingredient
  for (const ing of ingredients) {
    await DButils.execQuery(
      `INSERT INTO recipe_ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)`,
      [recipe_id, ing.name, ing.amount, ing.unit]
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

async function getUserCreatedRecipes(username) {
  const rows = await DButils.execQuery(
    `
    SELECT 
      r.id,
      r.title,
      r.servings,
      r.instructions,
      r.readyInMinutes,
      r.popularity,
      r.vegan,
      r.vegetarian,
      r.glutenFree,
      r.image,
      i.name AS ingredient_name,
      i.amount,
      i.unit
    FROM 
      recipes r
    LEFT JOIN 
      recipe_ingredients i 
    ON 
       r.id = i.recipe_id
    WHERE 
      r.username = ?
    `,
    [username]
  );

  // Transform flat results to grouped format
  const grouped = {};
  rows.forEach(row => {
    if (!grouped[row.id]) {
      grouped[row.id] = {
        id: row.id,
        title: row.title,
        servings: row.servings,
        instructions: row.instructions,
        readyInMinutes: row.readyInMinutes,
        popularity: row.popularity,
        vegan: row.vegan,
        vegetarian: row.vegetarian,
        glutenFree: row.glutenFree,
        image: row.image,
        ingredients: []
      };
    }

    if (row.ingredient_name) {
      grouped[row.id].ingredients.push({
        name: row.ingredient_name,
        amount: row.amount,
        unit: row.unit
      });
    }
  });

  return Object.values(grouped);
}

async function getFamilyRecipes(username) {
  const query = `
    SELECT family_member_name, relation, occasion, ingredients, preparation
    FROM family_recipes
    WHERE username = ?;
  `;
  return await DButils.execQuery(query, [username]);
}




exports.getFamilyRecipes = getFamilyRecipes;
exports.getUserCreatedRecipes = getUserCreatedRecipes;
exports.getUserCreatedRecipes = getUserCreatedRecipes;
exports.getUserCreatedRecipePreviews = getUserCreatedRecipePreviews;
exports.createRecipe = createRecipe;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
