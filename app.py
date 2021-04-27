from flask import Flask, render_template, request, redirect, url_for, flash, session, g, abort
from setup import query_db, db_update, update_insert
import click
from flask import current_app
from flask.cli import with_appcontext
import sqlite3, json
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
DATABASE = './database.db'
app.secret_key = 'some_secret'

# init_db() Creates the database
def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

@app.teardown_appcontext # Close the database if exception
def close_connecting(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def check_password(username, password):
    """Checks if username-password combination is valid."""
    # user password data typically would be stored in a database

    temp = query_db("SELECT passwordhash FROM user_login WHERE username=?", get_db(), username)
    if len(temp) != 0:
        hash = temp[0][0]
    else:
        return False

    return check_password_hash(hash, password)
    

def validate_input(username, password):
    """ Checks if a input if valid. Returns a list of errors, if any """
    errors = []
    if len(username) < 4:
        errors.append("Username must have at least 4 characters")
        
    if len(password) < 4:
        errors.append("Password must have at least 4 characters")

    return errors
   

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/users", methods=["GET", "POST", "PUT", "DELETE"])
def users():
    if request.method == "POST":
        
        
        username = request.form.get("username","").strip()
        password = request.form.get("password","")
        bio = request.form.get("bio","").strip()
        github = request.form.get("github","")

        errors = validate_input(username, password)
        
        if len(errors) == 0:
            try:
                hash = generate_password_hash(password)
                query_db("INSERT INTO user_login (username, passwordhash, bio, github) VALUES (?,?,?,?)", get_db(), username, hash, bio, github)
            except sqlite3.IntegrityError:
                errors.append("Username is already taken")
    
    response = {}
    response["errors"] = errors
    return json.dumps(response)


@app.route("/api/user/<userid>", methods=["GET", "PUT", "DELETE"])
def user(userid):

    if request.method == "GET":
        try:
            data = query_db("Select id, username, bio, color, email, twitter, github from user_login where id=?;", get_db(), int(userid))[0]
            
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
        
    
        
    else:
        errors = "unsupported method"
    
    response = {}
    response["errors"] = errors
    return json.dumps(response)

@app.route("/api/userid/<username>", methods = ["GET"])
def userid(username):
    userid = query_db("Select id from user_login where username=?;", get_db(), username.lower(), one=True)
    if userid==None:
        print(f"/api/userid/<username>: Could not find Userid {username}")
        return json.dumps(f"Could not find user")
    return json.dumps(userid[0])


@app.route("/api/session", methods=["POST", "GET", "DELETE"])
def login_toindex():
    response = {}
    if request.method == "POST":
        if session.get("username") == None:

            errors = validate_input(request.form["username"], request.form["password"])
            
            if len(errors) == 0:
                user = query_db("SELECT username FROM user_login WHERE username=?", get_db(), request.form["username"])
                
                if len(user) == 0: # Could not find user
                    errors.append("Incorrect username or password")

                else:
                    if check_password(request.form["username"], request.form["password"]):
                        session["username"] = user[0][0]
                    else:
                        errors.append("Incorrect username or password")
        else:
            errors = ["Please log out first"]

    if request.method == "GET":
        user = session.get("username")
        if user == None:
            user = ""
        return json.dumps(user)

    if request.method == "DELETE":
        session.pop("username")
        return json.dumps("Sucsess")
                
    response["errors"] = errors
    return json.dumps(response)

""" /api/projects returns a json object with the projects. JS gets this so we can use AJAX """
@app.route("/api/<username>/projects", methods = ["GET", "POST", "DELETE"])
def serve(username):
    if request.method == "GET":
        userid = query_db("SELECT id FROM user_login WHERE username = ?;", get_db(), username.lower(), one=True)
        if userid == None:
            print("Could not find userid")
            return json.dumps(["Could not find userid"])

        userid = userid[0]
        result = []
        data = query_db("SELECT * FROM PROJECTS WHERE userid = ? ORDER BY updated DESC;", get_db(), int(userid))
        for i, row in enumerate(data):
            result.append(dict())
            result[i]["id"] = row[0]
            result[i]["userid"] = row[1]
            result[i]["name"] = row[2]
            result[i]["created"] = row[3]
            result[i]["updated"] = row[4]
            result[i]["description"] = row[5]
            result[i]["website"] = row[6]
            result[i]["link"] = row[7]
            result[i]["private"] = row[8]

        return json.dumps(result)

    if request.method == "POST":
        userid = query_db("SELECT id FROM user_login WHERE username = ?;", get_db(), username, one=True)[0]
        errors = []
        response = {}
        # TODO or user.role == Admin:
        if session.get("username") == username:
            name = request.form["name"]
            created = request.form["created"]
            description = request.form["description"]
            sourceCode = request.form["sourceCode"]
            #userid = session["username"] 
            
            query_db("INSERT INTO Projects (userid, name, created, description, link) VALUES (?,?,?,?,?);", get_db(), userid, name, created, description, sourceCode)
            id = query_db("SELECT MAX(ID) FROM Projects", get_db(), one=True)[0]
            response["projectid"] = id
        else:
            errors = ["Unauthorized access"]

        response["errors"] = errors
        return json.dumps(response)

@app.route("/api/projects", methods = ["GET"])
def feed():
    if request.method == "GET":
        username = session.get("username")
        if username != None:
            userid = query_db("SELECT id FROM user_login WHERE username = ?;", get_db(), username, one=True)[0]
            
            data = query_db("SELECT * FROM PROJECTS WHERE userid = ? ORDER BY updated DESC;", get_db(), int(userid))
        else: 
            data = query_db("SELECT * FROM PROJECTS  ORDER BY created DESC;", get_db())

        result = []
        for i, row in enumerate(data):
            result.append(dict())
            result[i]["id"] = row[0]
            result[i]["userid"] = row[1]
            result[i]["name"] = row[2]
            result[i]["created"] = row[3]
            result[i]["updated"] = row[4]
            result[i]["description"] = row[5]
            result[i]["link"] = row[7]
            result[i]["private"] = row[8]

        return json.dumps(result)

@app.route("/api/project/<projectid>", methods = ["GET", "DELETE", "PUT"])
def project(projectid):
    if request.method == "GET":
        
        row = query_db("SELECT * FROM projects WHERE id = ?;", get_db(), projectid, one=True)
        
        result = dict()
        result["id"] = row[0]
        result["userid"] = row[1]
        result["name"] = row[2]
        result["created"] = row[3]
        result["updated"] = row[4]
        result["description"] = row[5]
        result["link"] = row[7]
        result["private"] = row[8]

        return json.dumps(result)

    if request.method == "DELETE":
        
        row = query_db("SELECT * FROM projects WHERE id = ?;", get_db(), projectid, one=True)
        query_db("DELETE FROM projects WHERE id = ?;", get_db(), projectid, one=True)
        
        result = dict()
        result["id"] = row[0]
        result["userid"] = row[1]
        result["name"] = row[2]
        result["created"] = row[3]
        result["updated"] = row[4]
        result["description"] = row[5]
        result["link"] = row[7]
        result["private"] = row[8]

        return json.dumps(result)

    if request.method == "PUT":
        errors = []

        id = request.form.get("id").strip()
        name = request.form.get("name","").strip()
        created = request.form.get("created","").strip()
        description = request.form.get("description","").strip()
        sourceCode = request.form.get("sourceCode","").strip()
        
        query_db("UPDATE projects SET name=?, created=?, description=?, link=? WHERE id = ?;", get_db(), name, created, description, sourceCode, id, one=True)
        row = query_db("SELECT * FROM projects WHERE id = ?;", get_db(), projectid, one=True)

        project = dict()
        project["id"] = row[0]
        project["userid"] = row[1]
        project["name"] = row[2]
        project["created"] = row[3]
        project["updated"] = row[4]
        project["description"] = row[5]
        project["link"] = row[7]
        project["private"] = row[8]

        result = dict()
        result["errors"] = errors
        result["project"] = project
        return json.dumps(result)

if __name__ == "__main__":
    app.run(debug=True)