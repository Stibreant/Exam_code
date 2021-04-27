# Code to update the database 
# API only allows 60 fetches a day, so we want to run this once a day. To get any new projects in.

# DONE Figure out database structure.
# DONE Implement a the structure into SQLite3 and flask.
# DONE Use AJAX to fetch and Flask to serve this data when the webpage is requested.
# TODO Preferably be able to find a way to see most recent project and dislpay on the index page.
# TODO Find a way to update this database daily. Proposed way; Run the code once a day in pythonanywhere 
    # and get the JSON file. Use this to loop through the database and update required fields. 
    # Need to think about deleting projects though it is unlikely done much anyway.
# TODO figure out how to use my own github account to get private repositories. IMPORTANT do not leak private key.
    # Filter wanted and unwanted repos...
 
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


# db_update() Updates the information, should be run once a day with the github API
def db_update():
    result_list = []
    with urllib.request.urlopen('https://api.github.com/users/stibreant/repos') as url:
        data = json.loads(url.read().decode())
        for repo in data:
            try:
                tmp = dict()
                tmp["name"] = repo["name"]
                tmp["created"] = repo["created_at"].split("T")[0]
                tmp["updated"] = repo["updated_at"].split("T")[0]
                tmp["description"] = repo["description"]
                tmp["website"] = repo["html_url"]
                tmp["link"] = None
                tmp["private"] = repo["private"]
                result_list.append(tmp)
            except:
                print("Maybe not a repo?")
                print(repo)
    return result_list


def update_insert():
    repos = db_update()
    number_of_rows = len(query_db("SELECT * FROM Projects;", get_db()))
    for i, repo in enumerate(repos):
        sql = f"""INSERT INTO Projects
        VALUES({number_of_rows+i+1}, '{repo["name"]}', '{repo["created"]}', '{repo["updated"]}', '{repo["description"]}' ,'{repo["website"]}' ,'{repo["link"]}','{repo["private"]}');
        """
        print(sql)
        query_db(sql, get_db())