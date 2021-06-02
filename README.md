# README File

# How To Run
Start the application by running `app.py` in the `Exam_code` folder.

# Functionality

- Users:
  * If a user tries to register and fails a specification e.g. password too short or etc., the server sends a JSON with all errors that the user must fix to register.
  * Users may be choose to delete their account and subsequently all information about this user will be deleted.
  * Users can change their username and Bio, Changes still gets checked for the same criteria as when a user is created.

- Projects:
  * Users that register with a github username will automatically get all their public repos' information into the application. The app will update the information if their userpage is visited and it has been at least 10 minutes since last time the information was updated. This is done by using the github API.
  * The user is free to add more projects as they choose. They can link to a website where the code is available and choose when they started working on the project as well as give a description and name for it. Any new projects will automatically create a new post, saying the user created a new project.
  * Projects are editable so any information can be edited (name, description, created date and website source code) except the last time the project was updated, any repos from github can be changed, but will be reset when the application updates the information.
  * You can delete projects, deleting a project will result in all posts connected to the project gets deleted.

- Posts:
  * You can add posts as you please, they have to be associated with a project and contain some text. Posts cannot be edited and only deleted.
  * When a new post is created the project of that post will have a new updated date. If a post is deleted a project will find the latest post about it and set the date accordingly.
  * Posts contain both a link to the user that created the post and a link to the project to see more about the project

- General:
  * If logged in and visiting a user page the user may elect to follow said user and said users will be shown on the home page.
  * The homepage shows user posts from people they follow and 10% of the posts will be of new posts that the user doesn't follow. These posts are shown in almost chronological order (to perserve the 90%/10% split). Not logged in users will only see posts in chronological order.
  * From the home page you can search for users and visit their page.
  * All actions are authenticated on the backend. Only the user that owns a project/post can delete or update these.


# Test Data
- users:
 * username: lazyprogrammer password: passwrd                   (A beginner of the app)
 * username: Musk123 password: ElongatedMelon                   (Normal user)
 * username: Spammer password: 12345                            (Has a lot of posts and projects)
 * username: Follow4Follow password: Pwease                     (Follows everyone)
 * username: TheLoner password: Aplha                           (Follows no one)
 * username: Leander password: 1234                             (Shows the app taking in repos from github with username *leandernikolaus*)

# Rest API

| Link                                 | GET                           | POST                        | PUT                               | DELETE                        |
|--------------------------------------|-------------------------------|-----------------------------|-----------------------------------|-------------------------------|
| /api/session                         | Gets username                 | Logs in a  new session      | N/A                               | Deletes session               |
| /api/userid/\<username\>             | Gets userid                   |                             |                                   |                               |
| /api/users                           | Gets list  of users           | Registers a new user        | Updates list  of users (N/A)      | Deletes list  of users (N/A)  |
| /api/user/\<userid\>                 | Gets userinfo                 | N/A                         | Updates  existing user            | Deletes user                  |
| /api/\<username\>/ projects          | Gets list of  user's projects | Posts a new project to user | Replaces the  entire list (N/A)   | Deletes list  of projects     |
| /api/project /\<projectid\>          | Gets project                  | N/A                         | Updates a project                 | Deletes a  project            |
| /api/followers/\<userid\>            | Gets followers  of user       | Gives user a  new follower  | Replace list  of followers  (N/A) | Deletes list  of followers    |
| /api/\<userid1\>/follows/\<userid2\> | Gives true  or false          | N/A                         | N/A                               | User1 stops  following user 2 |
| /api/\<username\>/posts              | Get posts  of user            | Posts a  new post           | Alters list  of posts             | Deletes list  of posts        |
| /api/post/\<postid\>                 | Get post                      | N/A                         | Alters post                       | Deletes post                  |