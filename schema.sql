DROP TABLE IF EXISTS Projects;
DROP TABLE IF EXISTS users;

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
    FOREIGN KEY(userid) REFERENCES users(id)
);