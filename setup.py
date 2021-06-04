from flask import g
import sqlite3
import urllib.request, json

DATABASE = './database.db'
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

# db_select() Takes the SQL statement and the connection to the database as paramaters.
def query_db(query, db, *args, **kwargs):
    one = kwargs.get('one', False)
    cursor = db.execute(query, (args))
    rv = cursor.fetchall()
    cursor.close()
    db.commit()
    return (rv[0] if rv else None) if one else rv


# db_update() Updates the information
def db_update(username):
    result_list = []
    if username != "":
        link = "https://api.github.com/users/" + username + "/repos"
        with urllib.request.urlopen(link) as url:
            data = json.loads(url.read().decode())
            for repo in data:
                try:
                    tmp = dict()
                    tmp["name"] = repo["name"]
                    tmp["created"] = repo["created_at"].split("T")[0]
                    tmp["updated"] = repo["updated_at"].split("T")[0]
                    tmp["description"] = repo["description"]
                    tmp["website"] = repo["html_url"]
                    tmp["link"] = repo["html_url"]
                    tmp["githubid"] = repo["id"]
                    result_list.append(tmp)
                except:
                    print("Maybe not a repo?")
                    print(repo)
        return result_list
    return []

# Find new repos from github and add them to the database
def update_insert(repos, userid):
    oldIDsSqlite = query_db("SELECT githubid from projects where userid=?", get_db(), userid)
    oldIDs = []
    if len(oldIDsSqlite) != 0:
        for i, oldid in enumerate(oldIDsSqlite):
            oldIDs.append(oldid["githubid"])

    for repo in repos:
        if repo["githubid"] not in oldIDs: 
            
            sql = f"INSERT INTO projects (userid, githubid ,name, created, updated, description, website, link) VALUES(?, ?, ?, ?, ?, ?, ?, ?);"
            query_db(sql, get_db(), userid, repo["githubid"], repo["name"], repo["created"], repo["updated"], repo["description"] ,repo["website"] ,repo["link"])
            
            id = query_db("SELECT MAX(ID) FROM Projects", get_db(), one=True)[0]
            
            sql = f"INSERT INTO posts (type, text, userid, projectid, date) VALUES(?, ?, ?, ?, ?);"
            query_db(sql, get_db(),"created a new project", None, userid, id, repo["created"])
        
        else:
            print("Project already exists")