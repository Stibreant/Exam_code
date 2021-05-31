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
        
        <div style="width: 100%; position: relative;"> 
            <h1>Home page</h1>
            <div id="searchcontainer">
                <searchc v-bind:data="this.usernames"></searchc>
            </div>
        </div>
        
        <br>

        <div v-for="project in this.projects">
            <projectc v-bind:username="project.username" v-bind:displayusername="true" v-bind:name="project.name" v-bind:editable="false" v-bind:id="project.id" v-bind:created="project.created" v-bind:updated="project.updated" v-bind:description="project.description" v-bind:link="project.link" v-bind:private="project.private"></projectc>
        </div>
        <div id="postcontainer">
            <postc v-for="post, i in this.posts" :date="post.date" :index="i" :id="post.id" :projectid="post.projectid" :text="post.text" :type="post.type" :username="post.username"></postc>
        </div>
    </div>
    `,
    data: function() { 
        return {
            projects: [],
            posts: [],
            username: null,
            user: state.user,
            following: [],
            usernames: [],
            userids: [],
        }
    },
    created: function() {
        //this.get_data();
    },
    mounted: function() {
        document.title = "Home";
        this.scroll();
        this.get_users();
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
                    this.get_following_posts()
                }
            }
        },
        get_following_posts: async function() {
            for (let i = 0; i < this.following.length; i++) {
                const element = this.following[i];
                let response = await fetch("/api/" + element + "/posts");
                if (response.status == 200){
                    let result = await response.json();
                    
                    for (i in result) {
                        this.posts.push(result[i]);
                        this.get_username(i);
                    }
                }
            }
        },
        get_users: async function() {
            let response = await fetch("/api/users");
                if (response.status == 200){    
                    let result = await response.json();
                    this.usernames = result.usernames;
                    this.userids = result.userids;
                    if (this.user.userid == ""){
                        for (let i = 0; i < this.userids.length; i++) {
                            const element = this.userids[i];
                            users_posts = await this.get_posts(element);
                            if (users_posts.length != 0){
                                this.posts.push(...users_posts)
                            }
                        }
                        for (i in this.posts){
                            this.get_username(i)
                        }
                    }
                }
        },
        get_posts: async function(userid){
            let response = await fetch("/api/"+ userid + "/posts");
                if (response.status == 200){
                    let result = await response.json();
                    return result;
                }
        },
        get_username: async function(i) {
            let response = await fetch("/api/user/"+ this.posts[i].userid);
                if (response.status == 200){
                    let result = await response.json();
                    this.posts[i].username = result.username;
                }
        },
        scroll () {
            window.onscroll = () => {
              let bottomOfWindow = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) + window.innerHeight === document.documentElement.offsetHeight
          
              if (bottomOfWindow) {
               this.scrolledToBottom = true // replace it with your code
               console.log("Bottom")
              }
           }
          },
    }
}

let userC = { 
    template: /*html*/ `
    <navbar v-on:updatedstate="this.check_followed"></navbar> 
    <div id="main">
    <h1>Username {{ $route.params.id }}</h1>
    

        <div class="framed" id="user">
        
            <!-- <figure><img src="" alt="Profile_picture"></figure> -->
            <i class="fa fa-user-circle-o fa-5x" aria-hidden="true"></i>

            <div id="text">
                <h2>Bio</h2>
                <p>{{ this.bio }}</p>
                <div v-if="this.loggedInUser.username!='' && this.loggedInUser.username!=$route.params.id ">
                    <button v-if="this.followed == false"  v-on:click="this.updatefollow">FOLLOW</button>
                    <button v-else v-on:click="this.updatefollow">UNFOLLOW</button>
                </div>
                
                <button v-if="this.loggedInUser.username==$route.params.id" @click="this.deleteUser"> DELETE ACCOUNT </button>
                
            </div>
        </div>

        <br>
        <h3>Posts:</h3> 
        <i v-if="this.loggedInUser.username==$route.params.id" class="fa fa-plus-square fa-2x" aria-hidden="true" @click="this.showpostform = !this.showpostform"></i>
        <postformc v-if="this.showpostform"  v-on:newpost="this.newPost" :projects="this.projects" :userid="this.loggedInUser.userid"></postformc>

        <postc v-for="post, i in this.posts" v-on:deleted="this.deletePost" v-bind:editable="this.editable" :index="i" :date="post.date" :id="post.id" :projectid="post.projectid" :text="post.text" :type="post.type" :username="$route.params.id"></postc>
        <i v-if="this.loaded==false" class="fa fa-spinner fa-spin"></i>
        <span v-if="this.loaded == true && this.posts.length == 0">User has yet to post</span>

        <br>
        
        <h3>Projects:</h3> 
        <i v-if="this.loggedInUser.username==$route.params.id" class="fa fa-plus-square fa-2x" aria-hidden="true" @click="this.showprojectform = !this.showprojectform"></i>
        <projectformc v-if="this.showprojectform" v-on:newProject="this.newProject" :userid="this.loggedInUser.userid"></projectformc>

        <projectc v-for="project, i in this.projects" v-on:deleted="this.deleteProject" v-on:edited="this.edit" v-bind:index="i" v-bind:editable="this.editable" v-bind:name="project.name" v-bind:id="project.id" v-bind:created="project.created" v-bind:updated="project.updated" v-bind:description="project.description" v-bind:link="project.link" v-bind:private="project.private" :override="project.override"></projectc>
        <i v-if="this.loaded==false" class="fa fa-spinner fa-spin"></i>
        <span v-if="this.loaded == true && this.projects.length == 0">User has no projects</span>

        <div v-if="this.showedit">
            <projectformc v-on:submit="this.updateEdit" v-bind:id="this.editinfo.id" v-bind:name="this.editinfo.name" v-bind:created="this.editinfo.created"  v-bind:description="this.editinfo.description" v-bind:link="this.editinfo.link" v-bind:private="this.editinfo.private"></projectformc>
        </div>
        <br>
    </div>
    `,
    data: function() { 
        return {
            pageuserid: null,
            followed: false,
            editable: false,
            projects: [],
            posts: [],
            loggedInUser: state.user,
            bio: "",
            showedit: false,
            showpostform: false,
            showprojectform: false,
            editinfo: {id: "",name: "", created: "", description: "", link: "", private: "", index: -1},
            loaded: false,
        }
    },
    created: async function() {
        document.title = "user: " + this.$route.params.id;
        this.get_data();
        // GET pageuserid
        let response2 = await fetch("/api/userid/" + this.$route.params.id);
        if (response2.status == 200){
            result = await response2.json();
            this.pageuserid = result;
        }

        if (this.loggedInUser.userid != ""){
            this.check_followed();
        }
        
    },
    methods: {
        get_data: async function() {
            let response2 = await fetch("/api/userid/" + this.$route.params.id);
            if (response2.status == 200){
                result = await response2.json();
                if (result == null) {  
                    this.$router.push("/")
                    alert("User " + this.$route.params.id +  " does not exist")
                }
                this.pageuserid = result;
            }

            // Get projects of user with user id
            let response = await fetch("/api/"+ this.pageuserid + "/projects");
            if (response.status == 200){
                let result = await response.json();
                this.projects = result;
            }

            // Get posts of user
            let response3 = await fetch("/api/"+ this.pageuserid + "/posts");
            if (response3.status == 200){
                let result = await response3.json();
                this.posts = result;
            }

            this.loaded = true;

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

        deleteProject: function(index) {
            project = this.projects[index];
            // Remove client-side all posts with project
            for (let i = this.posts.length-1; i >= 0; i--) {
                if (this.posts[i].projectid == project.id) {
                    this.posts.splice(i, 1);
                }
            }
            this.projects.splice(index, 1);
        },

        newProject: function(data) {
            // Updating client-side data
            let copy = JSON.parse(JSON.stringify(data));
            this.projects.push(copy)
        },
        newPost: function(newpost) {
            let copy = JSON.parse(JSON.stringify(newpost));

            var currentdate = new Date(); 
            var datetime = currentdate.getFullYear() + "-"
                + (currentdate.getMonth()+1)  + "-" 
                + currentdate.getDate() + " "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
            copy.date = datetime
            
            this.posts.push(copy)
        },
        deletePost: function(index) {
            this.posts.splice(index, 1)
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

            this.editable = (this.pageuserid==this.loggedInUser.userid)
        },
        deleteUser: async function(){
            if (confirm("Deleting a user is irreversible. All your data will be gone.\n Are you sure?")){
                
                let response = await fetch("/api/user/" + this.loggedInUser.userid, {
                method: "DELETE"
                });

                if (response.status == 200){
                    let result = await response.json();
                    alert(result)
                    console.log(result);
                }   
            }
        },
    }  
};