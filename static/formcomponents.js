let projectformC = {
    emits: {
        submit: (registerModel) => {
            return true
        },
        newProject: (registerModel) => {
            return true
        }
    },
    props: {
            id: {default: null},
            userid: {default: null},
            name: {default: ""}, 
            created: {default: ""},  
            description: {default: ""}, 
            link: {default: ""}, 
            private: {default: false},
    },
    template: /*html*/ `
    <div style="border: solid 2px black; width: 50%">
        <p v-if="errors.length">
                <b>Please correct the following error(s):</b>
                <ul>
                <li v-for="error in errors">{{ error }}</li>
                </ul>
            </p>

            <h2>Project form</h2>
            <form action="javascript:void(0);">
                <label>Name: </label> <br> <input type="text" name="name" v-model="registerModel.name" /><br/>
                <label>Created:</label> <br> <input type="date" name="password" v-model="registerModel.created"><br/>
                <label>Description:</label> <br> <textarea name="description" v-model="registerModel.description" maxlength="250"></textarea><br/>
                <label>Source code:</label> <br> <input type="text" name="link" v-model="registerModel.link"><br/>
                <button v-if="this.id==null" v-on:click="this.register"> Register </button>
                <button v-else v-on:click="this.edit"> edit </button>
            </form>
    </div>
    `,

    data: function() { 
        return {
            registerModel: {name: this.name, created: this.created, description: this.description, link: this.link},
            errors: [],
        }
      },

    methods: {
        register: async function(){
            if(this.registerModel.link == null){
                this.registerModel.link == "";
            }
            let response = await fetch("/api/"+ this.userid + "/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "name=" + this.registerModel.name + "&created=" + this.registerModel.created + "&description=" + this.registerModel.description + "&link=" + this.registerModel.link
            });
            if (response.status == 200){
                let result = await response.json();
                this.errors = result.errors;
                if (this.errors.length == 0) {
                    this.registerModel.id = result.projectid;
                    this.$emit('newProject', this.registerModel);
                }
                
                /*if (this.errors.length == 0){
                    this.$router.push('/user/' + state.user.username);
                }*/
            }
            
        },
        edit: async function(){

            let response = await fetch("/api/project/" + this.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "id=" + this.id + "&name=" + this.registerModel.name + "&created=" + this.registerModel.created + "&description=" + this.registerModel.description + "&link=" + this.registerModel.link
            });
            if (response.status == 200){
                let result = await response.json();
                this.errors = result.errors;
                if (this.id != null){
                    this.$emit('submit', this.registerModel);
                }
                
                /*if (this.errors.length == 0){
                    this.$router.push('/user/' + state.user.username);
                }*/
            }
        }
    }    
};

let postformC = {
    emits: {
        newpost: (postModel) => {
            return true
        },
    },
    props: {
            id: {default: null},
            userid: {required: true},
            text: {default: ""}, 
            type: {default: "updated"},  
            projectid: {default: null},
            projects: {},
    },
    template: /*html*/ ` 
    <div class="framed" style="width: 50%;">
        <p v-if="errors.length">
            <b>Please correct the following error(s):</b>
            <ul>
            <li v-for="error in errors">{{ error }}</li>
            </ul>
        </p>

        <h2>Create a new post:</h2>
        <form action="javascript:void(0);">
            <label for="project">Choose a Project:</label>

            <select name="project" v-model="postModel.projectid">
                <option v-for="project in this.projects" :value="project.id"> {{ project.name }} </option>
            </select>
            <br>
            <label>Text:</label> <br> <textarea name="text" v-model="postModel.text" maxlength="250"></textarea><br/>
            <button v-on:click="this.post"> Post </button>
        </form>
    </div>
    `,

    data: function() { 
        return {
            postModel: {id: this.id, projectid: this.projectid, text: this.text, userid: this.userid, type: this.type},
            errors: [],
        }
      },

    methods: {
        post: async function() {
            if (this.postModel.projectid == null){
                alert("You can't make a post without connecting it to a project")
                return 
            }
            let response = await fetch("/api/"+ this.userid + "/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "projectid=" + this.postModel.projectid + "&type=" + this.postModel.type + "&text=" + this.postModel.text
            });
            if (response.status == 200){
                let result = await response.json();
                this.postModel.id = result;
                this.$emit('newpost', this.postModel);

                // this.errors = result.errors;
                // if (this.errors.length == 0) {
                //     this.registerModel.id = result.projectid;
                //     this.$emit('newProject', this.registerModel);
                // }
            }
        }
    }    
};

let loginformC = {
    template: /*html*/`
        <navbar></navbar>
        <div id="main">
            <h1>Login</h1>

            <p v-if="errors.length">
                <b>Please correct the following error(s):</b>
                <ul>
                <li v-for="error in errors">{{ error }}</li>
                </ul>
            </p>

            <form action="javascript:void(0);" v-bind:onsubmit="this.login">
                <label>Username: <input type="text" name="username" v-model="loginModel.username" /></label><br />
                <label>Password: <input type="password" name="password" v-model="loginModel.password"></label><br />
                <input type="submit" value="login">
            </form>
        </div>
    `,

    data: function() { 
        return {
            username: null,
            loginModel: {username: "", password: ""},
            errors: [],
        }
      },

    methods: {
        login: async function(){
            let response = await fetch("/api/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "username=" + this.loginModel.username + "&password=" + this.loginModel.password
            });
            if (response.status == 200){
                let result = await response.json();
                this.errors = result.errors;

                if (result.errors.length == 0){
                    state.user.username = this.loginModel.username;
                    this.$router.push('/user/' + state.user.username);
                }
            }
        }
    }
};

let registerC = {
    template: /*html*/`
        <navbar></navbar>
        <div id="main">
            <h1>Start showing off your expertise today!</h1>
            <h2>Set up your new account</h2>

            <p v-if="errors.length">
                <b>Please correct the following error<b v-if="errors.length>1">s</b>:</b>
                <ul>
                <li v-for="error in errors">{{ error }}</li>
                </ul>
            </p>

            <form action="javascript:void(0);" v-bind:onsubmit="this.register">
                <label>Username: </label> <br> <input type="text" name="username" v-model="registerModel.username" /><br/>
                <label>Password:</label> <br> <input type="password" name="password" v-model="registerModel.password"><br/>
                <label>Bio:</label> <br> <textarea name="bio" v-model="registerModel.bio" maxlength="250"></textarea><br/>
                <label>Github username:</label> <br> <input type="text" name="bio" v-model="registerModel.github"><br/>
                <input type="submit" value="Register">
            </form>
        </div>
    `,

    data: function() { 
        return {
            registerModel: {username: "", password: "", bio: "", github: ""},
            errors: [],
        }
      },

    methods: {
        register: async function(){
            let response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "username=" + this.registerModel.username + "&password=" + this.registerModel.password + "&github=" + this.registerModel.github + "&bio=" + this.registerModel.bio
            });
            if (response.status == 200){
                let result = await response.json();
                this.errors = result.errors;
                if (this.errors.length == 0){
                    this.$router.push('/');
                }
            }
        },
    }
};