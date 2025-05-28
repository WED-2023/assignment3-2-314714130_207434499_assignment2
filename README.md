# 🍽️ Recipe Web API - Endpoint Documentation

This Node.js Express application provides a backend for managing and interacting with recipes. The API interacts with the Spoonacular API, handles user-created recipes, favorites, likes, and viewed history.

## 📁 Recipes Endpoints (`/recipes`)

### `GET /recipes/`
Health check - returns `"im here"`.

### `GET /recipes/details/:recipeId`
Returns full details for a recipe (Spoonacular or user-defined) by its ID.

### `GET /recipes/preview/:recipeId`
Returns a preview of the recipe (title, image, likes, etc.).

### `GET /recipes/random`
Returns 3 random recipes from Spoonacular.

### `GET /recipes/search?query=&cuisine=&diet=&intolerances=&number=`
Searches recipes on Spoonacular using filters and returns preview data.

### `GET /recipes/lastSearch`
Returns the query object from the last search made by the session user.

---

## 👤 User Endpoints (`/user`) (Requires Authentication)

### `POST /user/favorites`
Marks a recipe as favorite.  
**Body:** `{ recipeId }`

### `GET /user/favorites`
Returns previews of the logged-in user’s favorite recipes.

### `GET /user/lastViewed`
Returns previews of the last 3 recipes the user viewed.

### `POST /user/viewed`
Marks a recipe as viewed by the current user.  
**Body:** `{ recipeId }`

### `POST /user/create`
Creates a new user-defined recipe and stores it with ingredients and metadata.  
**Body:** Includes title, image, metadata, instructions, servings, ingredients array.

### `GET /user/myRecipes`
Returns full data (including ingredients) of all recipes created by the current user.

### `GET /user/myPreviews`
Returns preview format for user-created recipes.

### `POST /user/selfcreatedviewed`
Marks a user-created recipe as viewed by the author.  
**Body:** `{ recipeId }`

### `POST /user/like`
Adds a like to a recipe (user or Spoonacular).  
**Body:** `{ recipe_id }`

### `GET /user/familyRecipes`
Returns all family recipes for the logged-in user.

---

## 💡 Notes

- Spoonacular API is used for fetching external recipes.
- User-created recipes and favorites are stored in your SQL DB.
- `req.session.username` is used for session tracking and auth.
- `recipe_utils.js` and `user_utils.js` handle DB logic and external API integration.

---