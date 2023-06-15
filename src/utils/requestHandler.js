import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { getRequestData } from './getRequestData.js';
import { IncomingMessage, ServerResponse } from 'http';
import { readUsersFile, readPostsFile, writeUsersFile, writePostsFile } from './filesReadAndWrite.js';

/**
 * This function manage a HTTP request
 *
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */

export const requestHandler = async (request, response) => {
  const { headers, method, url } = request;
  const { address, port } = request.socket.server.address();
  const fullEndpoint = `http://${address}:${port}${url}`;

  console.log(url);

  const path = url.split('/')[1];
  const data = {
    error: ReasonPhrases.OK,
    message: 'success'
  };

  switch (path) {
    case 'users': {
      const usersPattern = new URLPattern({ pathname: '/users/:id' });
      const usersEndpoint = usersPattern.exec(fullEndpoint);
      const id = usersEndpoint?.pathname?.groups?.id;

      switch (method) {
        case 'POST':
          // Create new user
          const body = await getRequestData(request);
          const newUser = JSON.parse(body);

          // Save the new user to the users file
          const users = await readUsersFile();
          users.push(newUser);
          await writeUsersFile(users);

          // Send response
          response.setHeader('Content-Type', 'application/json');
          response.statusCode = StatusCodes.CREATED;
          data.error = ReasonPhrases.CREATED;
          data.message = 'User created successfully';
          data.newUser = newUser;
          break;

        case 'GET':
          if (parseInt(id)) {
            console.log(`Getting a user by id: ${id}`);
            const users = await readUsersFile();
            const user = users.find((user) => parseInt(user.id) === parseInt(id));
            
            // Send response
            response.setHeader('Content-Type', 'application/json');
            if (user) {
              response.statusCode = StatusCodes.OK;
              data.error = ReasonPhrases.OK;
              data.message = 'Get the user';
              data.user = user;
            } else {
              response.statusCode = StatusCodes.NOT_FOUND;
              data.error = ReasonPhrases.NOT_FOUND;
              data.message = 'User not found';
            } 
          } else {
            console.log('Getting all users');
            data.users = users;
            response.setHeader('Content-Type', 'application/json');
            response.statusCode = StatusCodes.OK;
            data.error = ReasonPhrases.OK;
            data.message = 'Getting all users';
          }
          break;
        
        case 'PATCH':
          if (parseInt(id)) {
            console.log(`Updating user by id: ${id}`);
            const body = await getRequestData(request);
            const updatedUser = JSON.parse(body);
            const users = await readUsersFile();

            // Find user 
            const user = users.find((user) => parseInt(user.id) === parseInt(id));
            if (user) {
              // Update user and save users to file
              Object.assign(user, updatedUser);
              await writeUsersFile(users);

              // Send response
              response.setHeader('Content-Type', 'application/json');
              response.statusCode = StatusCodes.OK;
              data.error = ReasonPhrases.OK;
              data.message = 'User updated successfully';
              data.user = user;
            } else {
              response.setHeader('Content-Type', 'application/json');
              response.statusCode = StatusCodes.NOT_FOUND;
              data.error = ReasonPhrases.NOT_FOUND;
              data.message = 'User not found';
            }
          } else {
            // Invalid request
            response.setHeader('Content-Type', 'application/json');
            response.statusCode = StatusCodes.BAD_REQUEST;
            data.error = ReasonPhrases.BAD_REQUEST;
            data.message = 'Invalid request';
          } 
          break;
        
        case 'DELETE':
          // Deleting user by id
          if (parseInt(id)) {
            console.log(`Deleting user by id: ${id}`);
            const users = await readUsersFile();

            // Filter out user to be deleted
            const updatedUsers = users.filter((user) => parseInt(user.id) !== parseInt(id));

            // Save the updated users to the users file
            await writeUsersFile(updatedUsers);

            // Send response
            response.setHeader('Content-Type', 'application/json');
            response.statusCode = StatusCodes.OK;
            data.error = ReasonPhrases.OK;
            data.message = 'User deleted successfully';
          } else {
            response.setHeader('Content-Type', 'application/json');
            response.statusCode = StatusCodes.BAD_REQUEST;
            data.error = ReasonPhrases.BAD_REQUEST;
            data.message = 'Invalid request';
          }
          break;
        
        default:
          // Invalid method
          response.setHeader('Content-Type', 'application/json');
          response.statusCode = StatusCodes.METHOD_NOT_ALLOWED;
          data.error = ReasonPhrases.METHOD_NOT_ALLOWED;
          data.message = 'Method not allowed';
          break
      }

      break
    }

    case 'posts': {
      const postsPattern = new URLPattern({ pathname: '/posts/:id' });
      const postsEndpoint = postsPattern.exec(fullEndpoint);
      const id = postsEndpoint?.pathname?.groups?.id;
      console.log(`dealing with posts - id: ${id}`);

      switch (method) {
        case 'POST':
          const body = await getRequestData(request);
          const newPost = JSON.parse(body);

          // Save the new user to the user file
          const posts = await readPostsFile();
          posts.push(newPost);
          await writePostsFile(posts);

          // Send response
          response.setHeader('Content-Type', 'application/json');
          response.statusCode = StatusCodes.CREATED;
          data.error = ReasonPhrases.CREATED;
          data.message = 'Post created successfully';
          data.newPost = newPost;
          break;
        
        case 'GET':
          if (parseInt(id)) {
            console.log(`Getting a post by Id: ${id}`);
            const posts = await readPostsFile();
            const post = posts.find((post) => parseInt(post.post_id) === parseInt(id));

            // Send response
            response.setHeader('Content-Type', 'application/json');
            if (post) {
              response.statusCode = StatusCodes.OK;
              data.error = ReasonPhrases.OK;
              data.message = 'Found the post';
              data.post = post;
            } else {
              response.statusCode = StatusCodes.NOT_FOUND;
              data.error = ReasonPhrases.NOT_FOUND;
              data.message = 'Post not found';
            } 
          } else {
            console.log('Getting all posts');
            const posts = await readPostsFile();

            // Send response
            response.setHeader('Content-Type', 'application/json');
            response.statusCode = StatusCodes.OK;
            data.error = ReasonPhrases.OK;
            data.message = 'Getting all posts';
          }
          break;
        
        case 'PATCH':
          if (parseInt(id)) {
            console.log(`Updating post by id: ${id}`);
            const body = await getRequestData(request);
            const updatedPost = JSON.parse(body);
            const posts = await readPostsFile();
            const post = posts.find((post) => parseInt(post.post_id) === parseInt(id));
            
            if (post) {
              // Update post and save posts to file
              Object.assign(post, updatedPost);
              await writePostsFile(posts);
  
              // Send response
              response.setHeader('Content-Type', 'application/json');
              response.statusCode = StatusCodes.OK;
              data.error = ReasonPhrases.OK;
              data.message = 'Post updated successfully';
              data.post = post;
            } else {
              response.setHeader('Content-Type', 'application/json');
              response.statusCode = StatusCodes.NOT_FOUND;
              data.error = ReasonPhrases.NOT_FOUND;
              data.message = 'Post not found';
            }
          } else {
            // Invalid request
            response.setHeader('Content-Type', 'application/json');
            response.statusCode = StatusCodes.BAD_REQUEST;
            data.error = ReasonPhrases.BAD_REQUEST;
            data.message = 'Invalid request';
          }
          break;
        
        case 'DELETE':
            if (parseInt(id)) {
              console.log(`Deleting post by id: ${id}`);
              const posts = await readPostsFile();
  
              // Filter out user to be deleted and save the remaining to posts
              const updatedPosts = posts.filter((post) => parseInt(post.post_id) !== parseInt(id));
              await writePostsFile(updatedPosts);
  
              // Send response
              response.setHeader('Content-Type', 'application/json');
              response.statusCode = StatusCodes.OK;
              data.error = ReasonPhrases.OK;
              data.message = 'Post deleted successfully';
            } else {
              response.setHeader('Content-Type', 'application/json');
              response.statusCode = StatusCodes.BAD_REQUEST;
              data.error = ReasonPhrases.BAD_REQUEST;
              data.message = 'Invalid request';
            }
          break;
        
        default:
          // Invalid method
          response.setHeader('Content-Type', 'application/json');
          response.statusCode = StatusCodes.METHOD_NOT_ALLOWED;
          data.error = ReasonPhrases.METHOD_NOT_ALLOWED;
          data.message = 'Method not allowed';
          break
      }
      break;
    }
  }

  

  response.setHeader('Content-Type', 'application/json')
  response.statusCode = StatusCodes.OK

  response.write(JSON.stringify(data))
  response.end()
}