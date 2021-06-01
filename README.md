# README File

# How To Run
Start the application by running `app.py` in the `Exam_code` folder.

# Functionality

- Users:
  * If a user tries to register and fails a specification e.g. password too short, the server sends a JSON with all errors that the user must fix to register.
  * Users may be choose to delete their account and subsequently all information about this user will be deleted.
- Projects:
  * Users that register with a github username will automatically get all their public repos' information into the application. The app will update the information if their userpage is visited and it has been at least 10 minutes since last time the information was updated. This is done by using the github API.
  * The user is free to add more projects as they choose. They can link to a website where the code is available and choose when they started working on the project as well as give a description and name for it.
  * Projects are editable so any information can be edited (name, description, created date and website source code) except the last time the project was updated, any repos from github can be changed, but will be reset when the application updates the information.
  * You can delete projects, deleting a project will result in all posts connected to the project gets deleted.

- Posts:
  * You can add posts as you please, they have to be associated with a project and contain some text. Posts cannot be edited and only deleted. (Update the updated_date on project STIAN).

- General:
  * If logged in and visiting a user page the user may elect to follow said user and said users will be shown on the home page.
  * The homepage shows user posts from people they follow and 10% of the posts will be of new posts that the user doesn't follow. These posts are shown in almost chronological order (to perserve the 90%/10% split). Not logged in users will only see posts in chronological order.
  * From the home page you can search for users and visit their page.
  * All actions are authenticated on the backend. Only the user that owns a project/post can delete or update these.
