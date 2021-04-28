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
            name: {default: ""}, 
            created: {default: ""},  
            description: {default: ""}, 
            sourceCode: {default: ""}, 
            private: {default: false},
    },
    template: /*html*/ ` 
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
            <label>Source code:</label> <br> <input type="text" name="sourceCode" v-model="registerModel.sourceCode"><br/>
            <button v-if="this.id==null" v-on:click="this.register"> Register </button>
            <button v-else v-on:click="this.edit"> edit </button>
        </form>
        
    `,

    data: function() { 
        return {
            registerModel: {name: this.name, created: this.created, description: this.description, sourceCode: this.sourceCode},
            errors: [],
        }
      },

    methods: {
        register: async function(){
            let response = await fetch("/api/"+ this.$route.params.id + "/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "name=" + this.registerModel.name + "&created=" + this.registerModel.created + "&description=" + this.registerModel.description + "&sourceCode=" + this.registerModel.sourceCode
            });
            if (response.status == 200){
                let result = await response.json();
                this.errors = result.errors;
                this.registerModel.id = result.projectid;
                this.$emit('newProject', this.registerModel);
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
                body: "id=" + this.id + "&name=" + this.registerModel.name + "&created=" + this.registerModel.created + "&description=" + this.registerModel.description + "&sourceCode=" + this.registerModel.sourceCode
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

let loginformC = {
    template: /*html*/`
        <navbar></navbar>
        <div id="main">
            <h1>HOME PAGE</h1>

            <p v-if="errors.length">
                <b>Please correct the following error(s):</b>
                <ul>
                <li v-for="error in errors">{{ error }}</li>
                </ul>
            </p>

            <h2>Login form</h2>
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
                }
            }
        }
    }
};

let registerC = {
    template: /*html*/`
        <navbar></navbar>
        <div id="main">
            <h1>Register</h1>

            <p v-if="errors.length">
                <b>Please correct the following error(s):</b>
                <ul>
                <li v-for="error in errors">{{ error }}</li>
                </ul>
            </p>

            <h2>Registration form</h2>
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