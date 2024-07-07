# Youtube and Twitter Backend

## Description
This project is a complex backend project that is built with nodejs, expressjs, mongodb, mongoose, jwt, bcrypt, and many more. This project is a complete backend project that has all the features that a backend project should have. We are building a complete video hosting website similar to youtube with all the features like login, signup, upload video, like, dislike, comment, reply, subscribe, unsubscribe, and many more.

Project uses all standard practices like JWT, bcrypt, access tokens, refresh Tokens and many more. We have spent a lot of time in building this project and we are sure that you will learn a lot from this project.

## Features
- User registration and authentication(just a simple authentication with cookies).
- Posting tweets and comments.
- Uploading and managing avatars and cover images via Cloudinary.
- Video uploading, commenting, and management.
- Subscription and following functionality.
- Managing likes on tweets and videos.
- Creating and managing playlists.
- User dashboard for managing account settings and activities.


## Note Before Installation
> 📝 **IMPORTANT:** You must have a Cloudinary ID to use the API, specifically the API name and secret key. These credentials are essential for integrating Cloudinary services into your project, allowing you to upload and manage images and videos securely.

### Steps to Set Up Using Docker

1. **Pull the image and run it locally**
    Run the Docker container using the command 
    ```bash
    docker run -p 8000:8000 youtube-twitter-backend



## Installation Instructions
1. Clone the repository.
2. Create a `.env` file in the root directory.
3. Copy the contents of `env.sample` into the `.env` file.
4. Fill in the required environment variables, including Cloudinary API name and secret key.
5. Install the project dependencies using `npm install`.
6. Run the application using `npm run dev`.

## Usage Instructions
This project provides a practical example for learning Node.js development practices and understanding industry-driven code structures. It can be used to explore backend development concepts, especially those related to social media applications.

## Dependencies
- Node.js
- Express
- Mongoose
- MongoDB
- Cloudinary (for image and video hosting)

External Services:
- Cloudinary: Requires an account to obtain API name and secret key.

## Contributing Guidelines
Currently, there are no specific guidelines for contributions.

## License
No specific license applied.

## Contact Information
For inquiries or contributions, please visit my Twitter profile: [Twitter Profile](https://twitter.com/grgnabin60).

## Routes Declaration
The project utilizes the following routes for different functionalities:
- User-related operations: `/api/v1/users`
- Tweet-related operations: `/api/v1/tweets`
- Subscription-related operations: `/api/v1/subscriptions`
- Video-related operations: `/api/v1/videos`
- Comment-related operations: `/api/v1/comments`
- Like-related operations: `/api/v1/likes`
- Playlist-related operations: `/api/v1/playlist`
- Dashboard-related operations: `/api/v1/dashboard`

## Thank You for Reviewing!
Thank you for taking the time to review this documentation. Your interest in exploring and potentially contributing to this project is greatly appreciated. If you have any questions, feedback, or wish to contribute, please don't hesitate to reach out. Happy coding!

---

This concludes the documentation for the Youtube and Twitter Backend project. For further inquiries or updates, please refer to the contact information provided earlier..
