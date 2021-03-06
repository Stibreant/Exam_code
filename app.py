from flask import Flask, render_template, request, session, g
from setup import query_db, db_update, update_insert
import sqlite3, json
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

app = Flask(__name__)
DATABASE = './database.db'
app.secret_key = 'zH2l72&X#Ho^5iWnc7@#nbdmHK63XmG1'

app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
)

# init_db() Creates the database
def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

# Close the database if exception
@app.teardown_appcontext 
def close_connecting(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Get connection, wtith PRAGMA foreing_keys
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.execute("PRAGMA foreign_keys = ON")
    db.row_factory = sqlite3.Row
    return db

# Check username and encrypted password
def check_password(username, password):
    """Checks if username-password combination is valid."""
    temp = query_db("SELECT passwordhash FROM users WHERE username=?", get_db(), username)
    if len(temp) != 0:
        hash = temp[0][0]
    else:
        return False
    return check_password_hash(hash, password)

# Validate_input check if username and password follows specifications returns True/False
def validate_input(username, password):
    """ Checks if a input if valid. Returns a list of errors, if any """
    errors = []
    if len(username) < 4:
        errors.append("Username must have at least 4 characters")
    
    elif len(username) > 20:
        errors.append("Username cannot be more than 20 characters")
        
    if len(password) < 4:
        errors.append("Password must have at least 4 characters")

    elif len(password) > 20:
        errors.append("Password cannot be more than 20 characters")
    return errors

# Validate_bio check if bio follows specifications returns True/False
def validate_bio(bio):
    """ Checks if a input if valid. Returns a list of errors, if any """
    errors = []
    if len(bio) == 0:
            errors.append("A user must have a bio")
    elif len(bio) > 250:
        errors.append("A bio cannot be more than 250 characters")
    return errors

# Validate_session Check userid sent in with session userid, returns True/False
def validate_session(test_userid):
    userid = session.get("userid")
    if str(userid) == str(test_userid):
        return True
    else:
        return False

# Route("/") Serve intial Page
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/users", methods=["GET", "POST"])
def users():
    # Prepare response
    response = {}
    errors = []

    if request.method == "POST":
        username = request.form.get("username","").strip().lower()
        password = request.form.get("password","")
        bio = request.form.get("bio","").strip()
        github = request.form.get("github","").strip() 
        email = request.form.get("email","").strip()
        twitter = request.form.get("twitter","").strip()

        errors = validate_input(username, password)
        
        # Validate Bio
        for error in validate_bio(bio):
            errors.append(error)
        
        if len(errors) == 0:
            try:
                # Insert user
                hash = generate_password_hash(password)
                query_db("INSERT INTO users (username, passwordhash, bio, github, twitter, email, timestamp) VALUES (?,?,?,?, ?, ?,datetime('now', 'localtime'))", get_db(), username, hash, bio, github, twitter, email)
                userid = query_db("SELECT MAX(ID) FROM users", get_db(), one=True)[0]
            except sqlite3.IntegrityError:
                errors.append("Username is already taken")
            else:
                # Get GitHub repos if GitHub username
                if github != "":
                    repos = db_update(github)
                    update_insert(repos, userid)
    
    if request.method == "GET":
        usernames = []
        userids = []
        query = query_db("SELECT username, id from users", get_db())
        for user in query:
            usernames.append(user[0])
            userids.append(user[1])
        response["usernames"] = usernames
        response["userids"] = userids
    
    response["errors"] = errors
    return json.dumps(response)


@app.route("/api/user/<userid>", methods=["GET", "DELETE", "PUT"])
def user(userid):
    if request.method == "GET":
        try:
            data = query_db("Select id, username, bio, color, email, twitter, github, timestamp from users where id=?;", get_db(), int(userid))[0]
            
            user = {}
            user["id"] = data[0]
            user["username"] = data[1]
            user["bio"] = data[2]
            user["color"] = data[3]
            user["email"] = data[4]
            user["twitter"] = data[5]
            user["github"] = data[6]
        except:
            print(f"Could not find user with id: {userid}")
            user=None
        return json.dumps(user)
        
    if request.method == "DELETE":
        if validate_session(userid):
            query_db("DELETE FROM users WHERE id=?", get_db(), userid)
            session.pop("userid")
            return json.dumps("User deleted")
        else:
            return json.dumps("Permission denied")

    if request.method == "PUT":
        response = dict()
        errors = [] 
        if validate_session(userid):
            username = request.form.get("username").strip()
            errors = validate_input(username, "En Streng")

            bio = request.form.get("bio").strip()
            for error in validate_bio(bio):
                errors.append(error)

            color = request.form.get("color")
            twitter = request.form.get("twitter").strip()
            email = request.form.get("email").strip()

            if len(errors) == 0:
                # Check if different username
                if username != query_db("select username from users WHERE id=?", get_db(), session.get("userid"), one=True)[0]:
                    # Check if username is taken
                    taken = query_db("select count(username) FROM users WHERE username=?;", get_db(), username, one=True)
                    if taken[0] == 0:
                        query_db("UPDATE users SET username=?, bio=?, color=?, twitter=?, email=? WHERE id = ?;", get_db(), username, bio, color, twitter, email, userid, one=True)
                    else:
                        errors.append("Username is taken")
                else:
                    query_db("UPDATE users SET bio=?, color=?, twitter=?, email=? WHERE id = ?;", get_db(), bio, color, twitter, email, userid, one=True)

            response["errors"] = errors        
            return json.dumps(response)
        else:
            errors.append("You do not have permission to change this user")
            response["errors"] = errors
            return json.dumps("Permission denied")


# Route to convert username to userid.
@app.route("/api/userid/<username>", methods = ["GET"])
def userid(username):
    userid = query_db("Select id from users where username=?;", get_db(), username.lower(), one=True)
    if userid==None:
        print(f"/api/userid/<username>: Could not find Userid for {username}")
        return json.dumps(userid)
    return json.dumps(userid[0])


@app.route("/api/session", methods=["POST", "GET", "DELETE"])
def login_toindex():
    response = {}
    if request.method == "POST":
        if session.get("userid") == None:
            errors = validate_input(request.form["username"].lower(), request.form["password"])
            
            if len(errors) == 0:
                user = query_db("SELECT id FROM users WHERE username=?", get_db(), request.form["username"].lower(), one=True)
                
                if user == None: # Could not find user
                    errors.append("Incorrect username or password")

                else:
                    if check_password(request.form["username"].lower(), request.form["password"]):
                        session["userid"] = user[0]
                    else:
                        errors.append("Incorrect username or password")
        else:
            errors = ["Please log out first"]

    if request.method == "GET":
        user = dict()
        userid = session.get("userid")
        if userid == None:
            user["username"] = ""
            user["userid"] = ""
            return json.dumps(user)
        
        username = query_db("Select username from users where id=?;", get_db(), userid, one=True)
        user["userid"] = userid
        user["username"] = username[0]
        return json.dumps(user)

    if request.method == "DELETE":
        session.pop("userid")
        return json.dumps("Sucsess")
                
    response["errors"] = errors
    return json.dumps(response)

""" /api/projects returns a json object with the projects. JS gets this so we can use AJAX """
@app.route("/api/<userid>/projects", methods = ["GET", "POST"])
def serve(userid):
    if request.method == "GET":
        user = query_db("SELECT timestamp, github FROM users WHERE id = ?;", get_db(), userid, one=True)

        if user == None:
            print("Could not find userid")
            return json.dumps(["Could not find userid"])
        timestamp = user[0]

        # Check timestamp of user
        if add_10_minutes(timestamp) < str(datetime.now()):
            github = user[1]
            repos = db_update(github)
            update_insert(repos, userid)
            update_timestamp(userid)

        
        result = []
        data = query_db("SELECT * FROM PROJECTS WHERE userid = ? ORDER BY updated DESC;", get_db(), int(userid))
        for i, row in enumerate(data):
            result.append(dict())
            result[i]["id"] = row[0]
            result[i]["userid"] = row[1]
            result[i]["githubid"] = row[2]
            result[i]["name"] = row[3]
            result[i]["created"] = row[4]
            result[i]["updated"] = row[5]
            result[i]["description"] = row[6]
            result[i]["link"] = row[8]

        return json.dumps(result)

    if request.method == "POST":
        response = {}
        errors= []
        if validate_session(userid):
            name = request.form["name"]
            created = request.form["created"]
            description = request.form["description"]
            link = request.form.get("link","").strip()
            
            query_db("INSERT INTO Projects (userid, name, created, description, link, updated) VALUES (?,?,?,?,?, datetime('now', 'localtime'));", get_db(), userid, name, created, description, link)
            id = query_db("SELECT MAX(ID) FROM Projects", get_db(), one=True)[0]
            response["projectid"] = id

            
            sql = f"INSERT INTO posts (type, text, userid, projectid, date) VALUES(?, ?, ?, ?, datetime('now', 'localtime'));"
            query_db(sql, get_db(),"created a new project", None, userid, id)
            postid = query_db("SELECT MAX(ID) FROM posts", get_db(), one=True)[0]
            response["postid"] = postid
        else:
            errors = ["Unauthorized access"]

        response["errors"] = errors
        return json.dumps(response)

@app.route("/api/projects", methods = ["GET"])
def feed():
    if request.method == "GET":
        userid = session.get("userid")
        if userid != None:
            data = query_db("SELECT * FROM PROJECTS WHERE userid = ? ORDER BY updated DESC;", get_db(), int(userid))
        else: 
            data = query_db("SELECT * FROM PROJECTS  ORDER BY created DESC;", get_db())

        result = []
        for i, row in enumerate(data):
            result.append(dict())
            result[i]["id"] = row[0]
            result[i]["userid"] = row[1]
            result[i]["githubid"] = row[2]
            result[i]["name"] = row[3]
            result[i]["created"] = row[4]
            result[i]["updated"] = row[5]
            result[i]["description"] = row[6]
            result[i]["link"] = row[8]

        return json.dumps(result)

@app.route("/api/project/<projectid>", methods = ["GET", "DELETE", "PUT"])
def project(projectid):
    errors = []
    result = dict()
    if request.method == "GET":
        
        row = query_db("SELECT * FROM projects WHERE id = ?;", get_db(), projectid, one=True)
        
        result["id"] = row[0]
        result["userid"] = row[1]
        result["githubid"] = row[2]
        result["name"] = row[3]
        result["created"] = row[4]
        result["updated"] = row[5]
        result["description"] = row[6]
        result["link"] = row[8]
        return json.dumps(result)
    
    row = query_db("SELECT * FROM projects WHERE id = ?;", get_db(), projectid, one=True)
    if request.method == "DELETE":
        if validate_session(row[1]):
            query_db("DELETE FROM projects WHERE id = ?;", get_db(), projectid, one=True)
            
            result["id"] = row[0]
            result["userid"] = row[1]
            result["name"] = row[2]
            result["created"] = row[3]
            result["updated"] = row[4]
            result["description"] = row[5]
            result["link"] = row[7]
        else: 
            result["errors"] = ["Permission denied"]
        return json.dumps(result)

    if request.method == "PUT":
        
        if validate_session(row[1]):
            id = request.form.get("id").strip()
            name = request.form.get("name","").strip()
            created = request.form.get("created","").strip()
            description = request.form.get("description","").strip()
            link = request.form.get("link","").strip()
            
            query_db("UPDATE projects SET name=?, created=?, description=?, link=? WHERE id = ?;", get_db(), name, created, description, link, id, one=True)
            row = query_db("SELECT * FROM projects WHERE id = ?;", get_db(), projectid, one=True)

            project = dict()
            project["id"] = row[0]
            project["userid"] = row[1]
            project["name"] = row[2]
            project["created"] = row[3]
            project["updated"] = row[4]
            project["description"] = row[5]
            project["link"] = row[7]

            result["errors"] = errors
            result["project"] = project
        else:
            result["errors"] = ["Permission denied"]
        return json.dumps(result)

# Route for updating followers
@app.route("/api/followers/<userid>", methods = ["GET", "POST"])
def followers(userid):
    result = dict()
    if request.method == "POST":
        followerid = request.form["followerid"]
        if validate_session(followerid):
            query_db("INSERT INTO follows (userid, followerid) VALUES (?,?);", get_db(), userid, followerid)
            
            result["message"] = f"User: {followerid} now follows user: {userid}"
        else: 
            result["errors"] = ["Permission denied"]
        return json.dumps(result)

    if request.method == "GET":
        user_ids = query_db("SELECT followerid FROM follows WHERE userid=?", get_db(), userid)

        followers=[]
        for id in user_ids:
            followers.append(id[0])

        result["followers"] = followers
        return json.dumps(result)

@app.route("/api/follower/<userid>/<followerid>", methods = ["GET", "DELETE"])
def follower(userid, followerid):
    if request.method == "GET":
        query = query_db("SELECT * from follows WHERE userid=? AND followerid=?;", get_db(), userid, followerid, one=True)
        if query == None:
            return json.dumps(False)
        return json.dumps(True)
    
    if request.method == "DELETE":
        if validate_session(followerid):
            query_db("DELETE FROM follows WHERE userid=? AND followerid=?;", get_db(), userid, followerid, one=True)
        else:
            return json.dumps("Permission denied")
        return json.dumps(f"User: {followerid} stopped following user: {userid}")

# Return userids that the user follows
@app.route("/api/following/<userid>", methods = ["GET"])
def following(userid):
    if request.method == "GET":
        result = dict()
        user_ids = query_db("SELECT userid FROM follows WHERE followerid=?", get_db(), userid)

        followers=[]
        for id in user_ids:
            followers.append(id[0])

        result["followers"] = followers
        return json.dumps(result)

@app.route("/api/<userid>/posts", methods = ["GET", "POST"])
def posts(userid):
    if request.method == "GET":
        posts = []
        rows = query_db("SELECT * FROM posts WHERE userid = ? ORDER BY date DESC", get_db(), userid)

        for i, post in enumerate(rows):
            posts.append(dict())
            posts[i]["id"] = post[0]
            posts[i]["type"] = post[1]
            posts[i]["text"] = post[2]
            posts[i]["userid"] = post[3]
            posts[i]["projectid"] = post[4]
            posts[i]["date"] = post[5]

        if rows==None:
            posts = []

        return json.dumps(posts)

    if request.method == "POST":
        if validate_session(userid):
            projectid = request.form.get("projectid").strip()
            if projectid==None or projectid == "":
                return json.dumps("Posts needs to be connected to a project")
            
            type = request.form.get("type").strip()
            text = request.form.get("text","").strip()

            query_db("INSERT INTO posts (type, text, userid, projectid, date) VALUES (?, ?, ?, ?, datetime('now', 'localtime'));", get_db(), type, text, userid, projectid)
            id = query_db("SELECT MAX(ID) FROM posts", get_db(), one=True)[0]

            #Update update_date on project
            query_db("UPDATE projects SET updated=datetime('now', 'localtime') WHERE id=?;", get_db(), int(projectid))
            return json.dumps(id)
        else: 
            return json.dumps("Permission denied")

@app.route("/api/post/<postid>", methods = ["DELETE"])
def post(postid):
    response = dict()
    if request.method == "DELETE":
        row = query_db("SELECT userid, projectid FROM posts WHERE id = ?;", get_db(), postid, one=True)
        if validate_session(row[0]):
            query_db("DELETE FROM posts WHERE id = ?;", get_db(), postid, one=True)
            date = query_db("SELECT MAX(date) from posts WHERE projectid =?", get_db(), row[1])
            if date[0][0] == None:
                date = query_db("SELECT created from projects WHERE id =?", get_db(), row[1])
        

            query_db("UPDATE projects SET updated=? WHERE id=?", get_db(), date[0][0], row[1])
            response["date"] = date[0][0]
            return json.dumps(response)
        else:
            return json.dumps("Permission denied")


def update_timestamp(userid):
    query_db("UPDATE users SET timestamp=datetime('now', 'localtime') WHERE id=?", get_db(), userid)

def add_10_minutes(timestamp):
    add = timedelta(minutes = 10)
    original_time = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
    result = original_time + add
    return result.strftime("%Y-%m-%d %H:%M:%S")

if __name__ == "__main__":
    app.run(debug=True)