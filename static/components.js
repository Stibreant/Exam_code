let state = {
    user: Vue.reactive({
            username: "",
            userid: "",
    })
};

let homeC = {
    template: /*html*/ ` 

    <navbar v-on:loggedout="this.get_data" v-on:updatedstate="this.get_following"></navbar>
    <div id=main>
        <img src="/static/Pictures/Show the world.png" style="width: 100%;" alt="Banner image">

        <h1>Home page</h1>
        <searchc></searchc>
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
            user: state.user,
            following: [],
        }
    },
    created: function() {
        //this.get_data();
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
        },
        get_following: async function() {
            if (this.user.userid != ""){
                let response = await fetch("/api/following/"+ this.user.userid);
                if (response.status == 200){
                    let result = await response.json();
                    this.following = result.followers
                    this.get_following_projects()
                }
            }
        },
        get_following_projects: async function() {
            for (let i = 0; i < this.following.length; i++) {
                const element = this.following[i];
                let response = await fetch("/api/" + element + "/projects");
                if (response.status == 200){
                    let result = await response.json();
                    
                    for (i in result) {
                        this.projects.push(result[i]);
                        this.get_username(i);
                    }
                }
            }
        },
        get_username: async function(i) {
            let response = await fetch("/api/user/"+ this.projects[i].userid);
                if (response.status == 200){
                    let result = await response.json();
                    this.projects[i].username = result.username;
                }
        }
    }
}

let userC = { 
    template: /*html*/ `
    <navbar v-on:updatedstate="this.check_followed"></navbar> 
    <div id="main">
    <h1>Username {{ $route.params.id }}</h1>

        <div class="framed" id="user">
            <div id="text">
                <h2>Bio</h2>
                <p>{{ this.bio }}</p>
                <div v-if="this.loggedInUser.username!='' && this.loggedInUser.username!=$route.params.id ">
                    <button v-if="this.followed == false"  v-on:click="this.updatefollow">FOLLOW</button>
                    <button v-else v-on:click="this.updatefollow">UNFOLLOW</button>
                </div>

                <figure><img src="" alt="Profile_picture"></figure>
            </div>
            
        </div>

        <br>
        
        
        <projectc v-for="project, i in this.projects" v-on:deleted="this.updateDelete" v-on:edited="this.edit" v-bind:index="i" v-bind:editable="true" v-bind:name="project.name" v-bind:id="project.id" v-bind:created="project.created" v-bind:updated="project.updated" v-bind:description="project.description" v-bind:link="project.link" v-bind:private="project.private"></projectc>
        

        <div v-if="this.showedit">
            <projectformc v-on:submit="this.updateEdit" v-bind:id="this.editinfo.id" v-bind:name="this.editinfo.name" v-bind:created="this.editinfo.created"  v-bind:description="this.editinfo.description" v-bind:link="this.editinfo.link" v-bind:private="this.editinfo.private"></projectformc>
        </div>

        <projectformc v-on:newProject="this.newProject" :userid="this.loggedInUser.userid"></projectformc>
        <postc :projectid="1"></postc>
    </div>
    `,
    data: function() { 
        return {
            pageuserid: null,
            followed: false,
            projects: [],
            posts: [],
            loggedInUser: state.user,
            bio: "",
            showedit: false,
            editinfo: {id: "",name: "", created: "", description: "", link: "", private: "", index: -1}
        }
    },
    created: async function() {
        
        this.get_data();
        // GET pageuserid
        let response2 = await fetch("/api/userid/" + this.$route.params.id);
        if (response2.status == 200){
            this.pageuserid = await response2.json();
        }

        if (this.loggedInUser.userid != ""){
            this.check_followed();
        }
        
    },
    methods: {
        get_data: async function(){
            let response2 = await fetch("/api/userid/" + this.$route.params.id);
            if (response2.status == 200){
                this.pageuserid = await response2.json();
            }

            // Get projects of user with user id
            let response = await fetch("/api/"+ this.pageuserid + "/projects");
            if (response.status == 200){
                let result = await response.json();
                this.projects = result;
            }

            // Get userinfo from userid
            let response1 = await fetch("/api/user/" + this.pageuserid);
            if (response1.status == 200){
                let result = await response1.json();
                this.bio = result.bio;
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
            this.projects[index].link = data.link;
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
            newProject.link = data.link;
            newProject.private = data.private;
            this.projects.push(newProject)
        },

        updatefollow: async function() {
            console.log(state.user.userid)
            if (this.followed == false){
                // Post new follower
                let response = await fetch("/api/followers/" +  this.pageuserid, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: "followerid=" + this.loggedInUser.userid
                });
                if (response.status == 200){
                    let result = await response.json();
                    this.followed = true;
                    console.log(result);
                }
            }
            else {
                // Delete follower
                let response = await fetch("/api/follower/" + this.pageuserid + "/" + this.loggedInUser.userid, {
                    method: "DELETE"
                });
                if (response.status == 200){
                    let result = await response.json();
                    this.followed = false;
                    console.log(result);
                }   
            }
        },

        check_followed: async function() {
            if (this.loggedInUser.userid != ""){
                let response = await fetch("/api/follower/" + this.pageuserid + "/" + this.loggedInUser.userid);
                if (response.status == 200){
                    let result = await response.json();
                    this.followed = result;
                }
            }
            
        },
    }  
};