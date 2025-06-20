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
  console.log(`[DEBUG] Fetching recipe details for ID: ${recipe_id}`);
  
  // Try to get from your DB first
  const dbResults = await DButils.execQuery(
    "SELECT * FROM recipes WHERE id = ?",
    [recipe_id]
  );
  
  console.log(`[DEBUG] Database results for recipe ${recipe_id}:`, dbResults.length > 0 ? 'Found in DB' : 'Not found in DB');
  
  if (dbResults.length > 0) {
    const recipe = dbResults[0];
    console.log(`[DEBUG] Recipe from DB:`, { id: recipe.id, title: recipe.title, username: recipe.username });
    
    let analyzedInstructions = [];
    let instructions = recipe.instructions;

    // Try to parse as JSON, fallback to plain text
    if (instructions && instructions !== 'null') {
      try {
        const parsed = JSON.parse(instructions);
        if (Array.isArray(parsed)) {
          analyzedInstructions = parsed;
          // Optionally, also create a plain text version for 'instructions'
          instructions = parsed.map(instr => 
            (instr.steps || []).map(s => s.step).join('\n')
          ).join('\n');
        }
      } catch (e) {
        // Not JSON, treat as plain text
        analyzedInstructions = [{
          steps: [{ step: instructions }]
        }];
      }
    } else {
      analyzedInstructions = [{ steps: [] }];
      instructions = '';
    }

    // Fetch ingredients from recipe_ingredients table
    let extendedIngredients = [];
    try {
      console.log(`[DEBUG] Fetching ingredients for recipe ${recipe_id} from recipe_ingredients table`);
      const ingredientsResults = await DButils.execQuery(
        "SELECT name, amount, unit FROM recipe_ingredients WHERE recipe_id = ?",
        [recipe_id]
      );
      
      console.log(`[DEBUG] Ingredients query result:`, ingredientsResults);
      console.log(`[DEBUG] Found ${ingredientsResults.length} ingredients`);
      
      extendedIngredients = ingredientsResults.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        original: `${ing.amount} ${ing.unit} ${ing.name}`
      }));
      
      console.log(`[DEBUG] Formatted ingredients:`, extendedIngredients);
    } catch (error) {
      console.log("Could not fetch ingredients from recipe_ingredients table:", error);
      // Fallback to ingredients column if it exists
      extendedIngredients = recipe.ingredients && recipe.ingredients !== 'null' ? JSON.parse(recipe.ingredients) : [];
      console.log(`[DEBUG] Using fallback ingredients:`, extendedIngredients);
    }

    const result = {
      id: recipe.id,
      title: recipe.title,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      popularity: recipe.popularity,
      vegan: recipe.vegan,
      vegetarian: recipe.vegetarian,
      glutenFree: recipe.glutenFree,
      instructions: instructions,
      servings: recipe.servings,
      extendedIngredients: extendedIngredients,
      analyzedInstructions: analyzedInstructions
    };
    
    console.log(`[DEBUG] Final result for recipe ${recipe_id}:`, {
      ...result,
      extendedIngredientsCount: result.extendedIngredients.length
    });
    
    return result;
  }
  
  console.log(`[DEBUG] Recipe ${recipe_id} not found in DB, fetching from Spoonacular`);
  
  // Otherwise, fetch from Spoonacular
  let recipe_info = await getRecipeInformation(recipe_id);
  const likes = await getTotalLikes(recipe_id);

  let { id, title, readyInMinutes, image, vegan, vegetarian, glutenFree, instructions, servings, extendedIngredients, analyzedInstructions } = recipe_info.data;

  return {
    id,
    title,
    readyInMinutes,
    image,
    popularity: likes,
    vegan,
    vegetarian,
    glutenFree,
    instructions,
    servings,
    extendedIngredients,
    analyzedInstructions
  };
}



async function getPreview(recipe_id, username) {
  try {
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
      // Check if recipe was watched
      const watched = await DButils.execQuery(
        "SELECT 1 FROM viewed_recipes WHERE username = ? AND recipe_id = ?",
        [username, recipe_id]
      );
      wasWatched = watched.length > 0;

      // Check if recipe is favorite
      const favorite = await DButils.execQuery(
        "SELECT 1 FROM users_favorite WHERE username = ? AND recipe_id = ?",
        [username, recipe_id]
      );
      isFavorite = favorite.length > 0;
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
      viewed: wasWatched,
      isFavorite
    };
  } catch (error) {
    console.error(`Error in getPreview for recipe ${recipe_id}:`, error);
    throw error;
  }
}

async function getRandomRecipes(number = 3) {
  const response = await axios.get(`${api_domain}/random`, {
    params: {
      number: number,
      apiKey: process.env.spooncular_apiKey
    },
    timeout: 5000
  });

  // Format recipes into our standard preview format
  const formattedRecipes = await Promise.all(
    response.data.recipes.map(async (recipe) => {
      const totalLikes = await getTotalLikes(recipe.id);
      return {
        id: recipe.id,
        title: recipe.title,
        readyInMinutes: recipe.readyInMinutes,
        image: recipe.image,
        popularity: totalLikes,
        vegan: recipe.vegan,
        vegetarian: recipe.vegetarian,
        glutenFree: recipe.glutenFree
      };
    })
  );

  return formattedRecipes;
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
  const dbResult = await DButils.execQuery(
    "SELECT COUNT(*) AS count FROM recipe_likes WHERE recipe_id = ?",
    [recipe_id]
  );

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



