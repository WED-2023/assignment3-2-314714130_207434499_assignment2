require("dotenv").config();
const axios = require("axios");
const DButils = require("./DButils");
const api_domain = "https://api.spoonacular.com/recipes";
const apiKey = process.env.spooncular_apiKey;



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    console.time(`Spoonacular ${recipe_id}`);

  const result = await axios.get(`${api_domain}/${recipe_id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey
    },
    timeout: 5000  //  to avoid hanging forever
  });

  console.timeEnd(`Spoonacular ${recipe_id}`);
  return result;
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    const likes = await getTotalLikes(recipe_id);

    let { id, title, readyInMinutes, image,  vegan, vegetarian, glutenFree,instructions, servings, extendedIngredients, analyzedInstructions  } = recipe_info.data;

    return {
    id: id,
    title: title,
    readyInMinutes: readyInMinutes,
    image: image,
    popularity: likes,
    vegan: vegan,
    vegetarian: vegetarian,
    glutenFree: glutenFree,
    instructions: instructions,
    servings: servings,
    extendedIngredients: extendedIngredients,
    analyzedInstructions: analyzedInstructions
  };
}



async function getPreview(recipe_id, username) {
  const likes = await getTotalLikes(recipe_id);
  let recipe_info = await getRecipeInformation(recipe_id);
  let {
    id,
    title,
    readyInMinutes,
    image,
    vegan,
    vegetarian,
    glutenFree
  } = recipe_info.data;

  let wasWatched = false;
  let isFavorite = false;

  if (username) {
    const watched = await DButils.execQuery(
      "SELECT 1 FROM viewed_recipes WHERE username = ? AND recipe_id = ?",
      [username, recipe_id]
    );
    wasWatched = watched.length > 0;

    const favorite = await DButils.execQuery(
      "SELECT 1 FROM users_favorite WHERE username = ? AND recipe_id = ?",
      [username, recipe_id]
    );
    isFavorite = favorite.length > 0;
    // wasWatched = false;
    // isFavorite = false;


  }

  return {
    id,
    title,
    readyInMinutes,
    image,
    popularity: likes,
    vegan,
    vegetarian,
    glutenFree,
    wasWatched,
    isFavorite
  };
}

async function getRandomRecipes(number = 3) {
  const response = await axios.get(`${api_domain}/random`, {
    params: {
      number: number,
      apiKey: process.env.spooncular_apiKey
    },
    timeout: 5000
  });

  // Get total likes for each recipe
  const recipesWithLikes = await Promise.all(
    response.data.recipes.map(async (recipe) => {
      const totalLikes = await getTotalLikes(recipe.id);
      return {
        ...recipe,
        popularity: totalLikes
      };
    })
  );

  return recipesWithLikes;
}

async function searchRecipes({ query, cuisine, diet, intolerances,number = 5 }) {
  const apiKey = process.env.spooncular_apiKey;

  const response = await axios.get(`${api_domain}/complexSearch`, {
    params: {
      query,
      cuisine,
      diet,
      intolerances,
      number,
      addRecipeInformation: true, 
      apiKey,
    },
    timeout: 8000, //  longer timeout to avoid Spoonacular timeouts
  });

  return response.data;
}

async function getTotalLikes(recipe_id) {
  const dbResult = await DButils.execQuery(`
    SELECT COUNT(*) AS count FROM recipe_likes WHERE recipe_id = ${recipe_id}
  `);

  const dbLikes = dbResult[0].count;

  // Get Spoonacular likes
  const spoonacularInfo = await getRecipeInformation(recipe_id);
  const spoonacularLikes = spoonacularInfo.data.aggregateLikes || 0;

  return dbLikes + spoonacularLikes;
}







exports.getTotalLikes = getTotalLikes;
exports.searchRecipes = searchRecipes;
exports.getRandomRecipes = getRandomRecipes;
exports.getPreview = getPreview;
exports.getRecipeDetails = getRecipeDetails;



