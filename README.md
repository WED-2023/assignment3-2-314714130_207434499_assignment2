# Recipe Management API

This project is a Node.js and Express-based backend for managing users and recipes, including user authentication, recipe search, favorites, viewed recipes, and personal recipe creation.

## Features

- User Registration & Login with secure authentication
- Recipe Search & Details via Spoonacular API
- Favorites: Mark and retrieve favorite recipes
- Recently Viewed: Tracks last 3 recipes viewed
- User-Created Recipes: Create and view your own recipes
- Session Management with cookies
- Docker Support for easy deployment

## API Endpoints

### User Endpoints
- `POST /Register` - Register a new user
- `POST /Login` - User login
- `POST /Logout` - User logout

### Recipe Endpoints
- `GET /recipes/search` - Search for recipes using Spoonacular
- `GET /recipes/details/:recipeId` - Get full recipe details
- `GET /recipes/preview/:recipeId` - Get a preview of a recipe
- `GET /recipes/random` - Get 3 random recipes

### User Data Endpoints
- `GET /users/favorites` - Retrieve a user's favorite recipes
- `POST /users/favorites` - Add a recipe to favorites
- `GET /users/lastViewed` - Get the last 3 viewed recipes
- `POST /users/viewed` - Mark a recipe as viewed
- `POST /users/create` - Create a new user recipe
- `GET /users/myRecipes` - Retrieve recipes created by the logged-in user
