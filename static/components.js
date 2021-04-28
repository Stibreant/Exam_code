let state = {
    user: Vue.reactive({
            username: ""
    })
};

let homeC = {
    template: /*html*/ ` 

    <navbar v-on:loggedout="this.get_data"></navbar>
    <div id=main>
        <h1>Home page</h1>

        <!--
            <div class="framed" id="user">
                <div>
                    <h2>Bio</h2>
                    <p>{{ this.bio }}</p>
                </div>
                <figure><img src="" alt="Profile_picture"></figure>
            </div> 
        -->

        <br>

        <div v-for="project in this.projects">
            <projectc v-bind:username="project.username" v-bind:displayusername="true" v-bind:name="project.name" v-bind:editable="false" v-bind:id="project.id" v-bind:created="project.created" v-bind:updated="project.updated" v-bind:description="project.description" v-bind:link="project.link" v-bind:private="project.private"></projectc>
        </div>
    </div>
    `,
    data: function() { 
        return {
            projects: [],
            username: null,
            bio: ""
        }
    },
    created: function() {
        this.get_data();
    },
    methods: {
        get_data: async function(){
            let response = await fetch("/api/projects");
            if (response.status == 200){
                let result = await response.json();
                this.projects = result;
            }

            for (let i = 0; i < this.projects.length; i++) {
                const element = this.projects[i];

                let response = await fetch("/api/user/"+ element.userid);
                if (response.status == 200){
                    let result = await response.json();
                    element.username = result.username;
                }
            }

              
        }
    }
}

let userC = { 
    template: /*html*/ `
    <navbar></navbar> 
    <div id="main">
    <h1>Username {{ $route.params.id }}</h1>

        <div class="framed" id="user">
            <div>
                <h2>Bio</h2>
                <p>{{ this.bio }}</p>
            </div>
            <figure><img src="" alt="Profile_picture"></figure>
        </div>

        <br>
        
        <div v-for="project, i in this.projects">
            <projectc v-on:deleted="this.updateDelete" v-on:edited="this.edit" v-bind:index="i" v-bind:editable="true" v-bind:name="project.name" v-bind:id="project.id" v-bind:created="project.created" v-bind:updated="project.updated" v-bind:description="project.description" v-bind:link="project.link" v-bind:private="project.private"></projectc>
        </div>

        <div v-if="this.showedit">
            <projectformc v-on:submit="this.updateEdit" v-bind:id="this.editinfo.id" v-bind:name="this.editinfo.name" v-bind:created="this.editinfo.created"  v-bind:description="this.editinfo.description" v-bind:sourceCode="this.editinfo.link" v-bind:private="this.editinfo.private"></projectformc>
        </div>

        <projectformc v-on:newProject="this.newProject"></projectformc>
    </div>
    `,
    data: function() { 
        return {
            projects: [],
            username: null,
            bio: "",
            showedit: false,
            editinfo: {id: "",name: "", created: "", description: "", link: "", private: "", index: -1}
        }
    },
    created: function() {
        this.get_data();
    },
    methods: {
        get_data: async function(){
            let response = await fetch("/api/"+ this.$route.params.id + "/projects");
            if (response.status == 200){
                let result = await response.json();
                this.projects = result;
            }

            let response1 = await fetch("/api/userid/" + this.$route.params.id);
           
            if (response1.status == 200){
                let userid = await response1.json();

                let response2 = await fetch("/api/user/" + userid);
                if (response2.status == 200){
                    let result = await response2.json();
                    this.bio = result.bio;
                }
            }
        },
        edit: function(id, name, created, description, link, private, index) {
            this.showedit = !this.showedit;
            this.editinfo = {id: id,name: name, created: created, description: description, link: link, private: private, index: index};

        },
        // updateEdit updates clientside data
        updateEdit: function(data) {
            this.showedit = false;
            index = this.editinfo.index;
            
            // Updating client-side data
            this.projects[index].id = data.id;
            this.projects[index].name = data.name;
            this.projects[index].created = data.created;
            this.projects[index].description = data.description;
            this.projects[index].link = data.sourceCode;
            this.projects[index].private = data.private;
        },
        updateDelete: function(index) {
            this.projects.splice(index, 1)
        },
        newProject: function(data) {
            console.log(this.projects);
            let newProject = {};

            // Updating client-side data
            newProject.id = data.id;
            newProject.name = data.name;
            newProject.created = data.created;
            newProject.description = data.description;
            newProject.link = data.sourceCode;
            newProject.private = data.private;
            this.projects.push(newProject)
        }
    }
};

let navbarC = {
        template: /*html*/`
        <div class="navbar">
            <router-link to="/">Home</router-link>
            
            <router-link v-if=" this.user.username=='' " to="/login"> login </router-link>
            <router-link v-if=" this.user.username=='' " to="/register"> Register </router-link>

            
                <router-link v-if="this.user.username!='' " v-bind:to="'/user/' + this.user.username"> {{ this.user.username }}</router-link>
                <a v-if="this.user.username!=''" v-on:click="this.logout" href="/#/"> Log out </a>
            
        </div>
            
        `,
        data: function() {
            return {
                user: state.user
            }
        },

        created: async function() {
            let response = await fetch("/api/session");
                if (response.status == 200){
                    let result = await response.json();
                    state.user.username = result;
              }
        },
        methods: {
            logout: async function() {
                let response = await fetch("/api/session", {
                    method: "DELETE"
                });
                if (response.status == 200){
                    state.user.username = "";
                    this.$emit("loggedout")
                }
            }
        }
};

let projectC = {
    emits: {
        deleted: () => {
            return true;
        },
        edited: () => {
            return true;
        }
    },
    props: {
        id: {required: true}, 
        name: {required: true},
        index: {}, 
        username: {},
        created: {}, 
        updated: {}, 
        description: {}, 
        link: {}, 
        private: {},
        editable: {},
        displayusername: {}
    },
    template: /*html*/`
        <div class="framed"> 
            <div id="text">
                <h2>{{ this.name }}</h2> 
                {{ this.description }}
                <br>
                <br>
                <span v-if="this.link!=null&&this.link!='None'"> <br> Source code: <a v-bind:href="this.link"> {{ this.link }} </a></span>
                <br>
                <br>
                <div>
                    <span>
                        Project started:
                        <span style="float: right;">
                            Last updated:
                            <br>
                            {{ this.updated }}
                        </span>
                        <br>
                        {{ this.created }}
                    </span>
                    <br>
                    <div v-if="this.editable==true">
                        <button v-on:click="$emit('edited', this.id, this.name, this.created, this.description, this.link, this.private, this.index)">EDIT</button>
                        <button v-on:click="this.delete">DELETE</button>
                    </div>

                    <div v-if="this.displayusername==true">
                        Created by user: {{ this.username }}
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function () {
        return {
          
        }
      },
    
    methods: {
        delete: async function() {
            if (confirm("Are you sure you want to delete this?")){
                let response = await fetch("/api/project/" + this.id, {
                    method: "DELETE"
                });
                  if (response.status == 200){
                      let result = await response.json();
                      this.$emit("deleted", this.index);
                      console.log(result);
                  }
            }
            

        }
    }
};

let footerC = {
        template: /*html*/`
        <div id="footer">
            <span> Contact: <a href="mailto:stian.ba@hotmail.com">Ola@Nordmann.com</a></span>
            <div>
                <a href="https://www.facebook.com/stian.antonsen.773/" class="fa fa-facebook-square fa-2x"></a>
                <a href="https://www.linkedin.com/in/stian-brekken-antonsen-338a48207/" class="fa fa-linkedin fa-2x"></a>
                <a href="https://twitter.com/Stibreant" class="fa fa-twitter fa-2x"></a>
                <a href="https://github.com/Stibreant" class="fa fa-github fa-2x"></a>
                <span class="image">
                </span>
            </div>
        </div>
        `,
};

// let projectformC = {
//     emits: {
//         submit: (registerModel) => {
//             return true
//         }
//     },
//     props: {
//             id: {default: null},
//             name: {default: ""}, 
//             created: {default: ""},  
//             description: {default: ""}, 
//             sourceCode: {default: ""}, 
//             private: {default: false},
//     },
//     template: /*html*/ ` 
//     <p v-if="errors.length">
//             <b>Please correct the following error(s):</b>
//             <ul>
//             <li v-for="error in errors">{{ error }}</li>
//             </ul>
//         </p>

//         <h2>Project form</h2>
//         <form action="javascript:void(0);">
//             <label>Name: </label> <br> <input type="text" name="name" v-model="registerModel.name" /><br/>
//             <label>Created:</label> <br> <input type="date" name="password" v-model="registerModel.created"><br/>
//             <label>Description:</label> <br> <textarea name="description" v-model="registerModel.description" maxlength="250"></textarea><br/>
//             <label>Source code:</label> <br> <input type="text" name="sourceCode" v-model="registerModel.sourceCode"><br/>
//             <button v-if="this.id==null" v-on:click="this.register"> Register </button>
//             <button v-else v-on:click="this.edit"> edit </button>
//         </form>
        
//     `,

//     data: function() { 
//         return {
//             registerModel: {name: this.name, created: this.created, description: this.description, sourceCode: this.sourceCode},
//             errors: [],
//         }
//       },

//     methods: {
//         register: async function(){
//             let response = await fetch("/api/"+ this.$route.params.id + "/projects", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/x-www-form-urlencoded",
//                 },
//                 body: "name=" + this.registerModel.name + "&created=" + this.registerModel.created + "&description=" + this.registerModel.description + "&sourceCode=" + this.registerModel.sourceCode
//             });
//             if (response.status == 200){
//                 let result = await response.json();
//                 this.errors = result.errors;
//                 /*if (this.errors.length == 0){
//                     this.$router.push('/user/' + state.user.username);
//                 }*/
//             }
            
//         },
//         edit: async function(){
//             let response = await fetch("/api/project/" + this.id, {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/x-www-form-urlencoded",
//                 },
//                 body: "id=" + this.id + "&name=" + this.registerModel.name + "&created=" + this.registerModel.created + "&description=" + this.registerModel.description + "&sourceCode=" + this.registerModel.sourceCode
//             });
//             if (response.status == 200){
//                 let result = await response.json();
//                 this.errors = result.errors;
//                 if (this.id != null){
//                     this.$emit('submit', this.registerModel);
//                 }
                
//                 /*if (this.errors.length == 0){
//                     this.$router.push('/user/' + state.user.username);
//                 }*/
//             }
//         }
//     }    
// };

// let loginformC = {
//     template: /*html*/`
//         <h1>HOME PAGE</h1>

//         <p v-if="errors.length">
//             <b>Please correct the following error(s):</b>
//             <ul>
//             <li v-for="error in errors">{{ error }}</li>
//             </ul>
//         </p>

//         <h2>Login form</h2>
//         <form action="javascript:void(0);" v-bind:onsubmit="this.login">
//             <label>Username: <input type="text" name="username" v-model="loginModel.username" /></label><br />
//             <label>Password: <input type="password" name="password" v-model="loginModel.password"></label><br />
//             <input type="submit" value="login">
//         </form>
        
//     `,

//     data: function() { 
//         return {
//             username: null,
//             loginModel: {username: "", password: ""},
//             errors: [],
//         }
//       },

//     methods: {
//         login: async function(){
//             let response = await fetch("/api/session", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/x-www-form-urlencoded",
//                 },
//                 body: "username=" + this.loginModel.username + "&password=" + this.loginModel.password
//             });
//             if (response.status == 200){
//                 let result = await response.json();
//                 this.errors = result.errors;

//                 if (result.errors.length == 0){
//                     state.user.username = this.loginModel.username;
//                 }
//             }
//         }
//     }
// };

// let registerC = {
//     template: /*html*/`
//         <h1>Register</h1>

//         <p v-if="errors.length">
//             <b>Please correct the following error(s):</b>
//             <ul>
//             <li v-for="error in errors">{{ error }}</li>
//             </ul>
//         </p>

//         <h2>Registration form</h2>
//         <form action="javascript:void(0);" v-bind:onsubmit="this.register">
//             <label>Username: </label> <br> <input type="text" name="username" v-model="registerModel.username" /><br/>
//             <label>Password:</label> <br> <input type="password" name="password" v-model="registerModel.password"><br/>
//             <label>Bio:</label> <br> <textarea name="bio" v-model="registerModel.bio" maxlength="250"></textarea><br/>
//             <label>Github username:</label> <br> <input type="text" name="bio" v-model="registerModel.github"><br/>
//             <input type="submit" value="Register">
//         </form>
        
//     `,

//     data: function() { 
//         return {
//             registerModel: {username: "", password: "", bio: "", github: ""},
//             errors: [],
//         }
//       },

//     methods: {
//         register: async function(){
//             let response = await fetch("/api/users", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/x-www-form-urlencoded",
//                 },
//                 body: "username=" + this.registerModel.username + "&password=" + this.registerModel.password + "&github=" + this.registerModel.github + "&bio=" + this.registerModel.bio
//             });
//             if (response.status == 200){
//                 let result = await response.json();
//                 this.errors = result.errors;
//                 if (this.errors.length == 0){
//                     this.$router.push('/');
//                 }
//             }
//         },
//     }
// };