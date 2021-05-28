DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS posts;

CREATE TABLE users(
    id INTEGER, 
    username VARCHAR(20) NOT NULL UNIQUE, 
    passwordhash VARCHAR(120) NOT NULL, 
    token text,
    bio VARCHAR(250),
    color text,
    email text,
    twitter text,
    github text,
    timestamp DATETIME,
    PRIMARY KEY(id)
);

CREATE TABLE projects(
    id INTEGER PRIMARY KEY,
    userid INTEGER,
    githubid INTEGER,
    name TEXT,
    created DATE,
    updated DATE,
    description TEXT,
    website TEXT,
    link TEXT,
    private BOOLEAN,
    override BOOLEAN,
    FOREIGN KEY(userid) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE follows(
    userid INTEGER,
    followerid INTEGER,
    PRIMARY KEY (followerid, userid),
    FOREIGN KEY(followerid) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(userid) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE posts(
    id INTEGER PRIMARY KEY,
    type TEXT,
    text VARCHAR(250),
    userid INTEGER,
    projectid INTEGER,
    date DATETIME,
    FOREIGN KEY(userid) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(projectid) REFERENCES projects(id) ON DELETE CASCADE
);