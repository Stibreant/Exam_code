DROP TABLE IF EXISTS Projects;
DROP TABLE IF EXISTS user_login;
DROP TABLE IF EXISTS user_display;

CREATE TABLE user_login (
    id INTEGER, 
    username VARCHAR(20) NOT NULL, 
    passwordhash VARCHAR(120) NOT NULL, 
    token text,
    bio VARCHAR(250),
    color text,
    email text,
    twitter text,
    github text,
    PRIMARY KEY(id) 
    UNIQUE(username)
);

CREATE TABLE projects(
    id INTEGER PRIMARY KEY,
    userid INTEGER,
    name TEXT,
    created DATE,
    updated DATE,
    description TEXT,
    website TEXT,
    link TEXT,
    private BOOLEAN,
    FOREIGN KEY(userid) REFERENCES user_login(id)
);


/*INSERT INTO Projects
VALUES(1, "Memory game", "2021-03-01", "2021-03-01", "A game in that uses JS, find matching pairs by flipping cards.", NULL ,"/memory", NULL);

INSERT INTO Projects
VALUES(2, "Personal Website", "2021-03-01", "2021-04-01", "A website to show my capabilities in frontend and backend programming. And guess what, you are currently on that website. The website was built from the ground-up using HTML, CSS, Python, JS, Vue and uses AJAX on some pages.", "www.github.com" ,"/memory", FALSE);