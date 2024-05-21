import express, { Application } from 'express';
import bodyParser from 'body-parser';
import { finalizeQuest, validateQuest } from './middleware/questMiddleware';

// Initialize express app
const app: Application = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Route
app.post('/submit-quest', validateQuest, finalizeQuest);

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


// Notes:

// for the access conditions array, it should not be submitted but rather stored on our backend and then we check against them
// (otherwise the user can alter the conditions) - for the user claims (user_data), I assume you mean they come from a JWT (which is not the case for the quest)