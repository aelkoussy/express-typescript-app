Please copy the repo locally, run npm install 
then you can run the tests using npm test
or use npm start to run the server

Some notes are included within the codes, but most notable things that could be done:
1. we could separate middleware into multiple files
2. the access conditions array should be saved on the backend not posted through the frontend to the endpoint, this is to prevent any altering of it by the client
3. I assume the user_data is a JWT so it can't be altered by client as long as we check the signature of it
