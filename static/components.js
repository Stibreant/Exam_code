let homeC = {
    template: /*html*/ ` 
    <navbar v-on:loggedout="this.get_following" v-on:updatedstate="this.get_following"></navbar>
    <div id=main>
        <img src="/static/Pictures/Show the world.png" style="width: 100%;" alt="Banner image">
        
        <div style="width: 100%; position: relative;"> 
            <h1>Home page</h1>
            <div id="searchcontainer">
                <searchc v-bind:data="this.usernames"></searchc>
            </div>
        </div>
        
        <br>

        <div>
            <projectc v-for="project in this.projects" v-bind:username="project.username" v-bind:displayusername="true" v-bind:name="project.name" v-bind:editable="false" v-bind:id="project.id" v-bind:created="project.created" v-bind:updated="project.updated" v-bind:description="project.description" v-bind:link="project.link" v-bind:private="project.private"></projectc>
        </div>
        <div id="postcontainer">
            <i v-if="this.posts.length==0" class="fa fa-spinner fa-spin fa-2x"></i>
            <postc v-for="post, i in this.posts" :date="post.date" :index="i" :id="post.id" :projectid="post.projectid" :text="post.text" :type="post.type" :username="post.username"></postc>
        </div>
    </div>
    `,
    data: function() { 
        return {
            projects: [],
            posts: [],
            followposts: [],
            newposts: [],
            username: null,
            user: state.user,
            following: [],
            usernames: [],
            userids: [],
        }
    },
    mounted: function() {
        document.title = "Home";
    },
    methods: {
        get_following: async function() {
            if (this.user.userid != ""){
                let response = await fetch("/api/following/"+ this.user.userid);
                if (response.status == 200){
                    let result = await response.json();
                    
                    this.following = result.followers
                    await this.get_following_posts()
                }
            }
            else {
                this.following = []
            }
            this.get_users();
        },
        get_following_posts: async function() {
            for (i in this.following) {
                const element = this.following[i];
                let response = await fetch("/api/" + element + "/posts");
                if (response.status == 200){
                    let result = await response.json();
                    
                    for (i in result) {
                        await this.followposts.push(result[i]);
                        await this.get_username(this.followposts.length-1, "followpost");
                    }
                }
            }
        },
        dateSort: function( a, b ) { 
            if ( a.date < b.date ){
                return 1;
            }
            if ( a.date > b.date ){
                return -1;
            }
            return 0;
        },
        // Gets all users the user does not follow
        get_users: async function() {
            let response = await fetch("/api/users");
                if (response.status == 200){    
                    let result = await response.json();
                    this.usernames = result.usernames;
                    this.userids = result.userids;
                    for (let i = 0; i < this.userids.length; i++) {
                        const element = this.userids[i];
                        //if not following the user, add posts to new posts
                        if (!this.following.includes(this.userids[i]) && this.userids[i] != this.user.userid){
                            users_posts = await this.get_posts(element);
                            if (users_posts.length != 0){
                                for (j in users_posts){
                                    users_posts[j].username = this.usernames[i]
                                }
                                this.newposts.push(...users_posts)
                            }
                        }
                    }

                    // Sort by posttime.
                    this.newposts.sort( this.dateSort);
                    this.followposts.sort( this.dateSort );

                    /// MERGE ///
                    // Ten posts from following and 1 from newposts.
                    for (let i = 0; i < this.followposts.length; i++) {
                        for (let j = 0; j < 10; j++) {
                            if (i*10+j < this.followposts.length){
                                this.posts.push(this.followposts[i*10+j]);
                            }
                            if (j==9){
                                if(i < this.newposts.length) {
                                    this.posts.push(this.newposts[i]);
                                }
                                
                            }     
                        }
                        if (i*10+9> this.followposts.length && i*10+9 < this.newposts.length){
                            this.posts.push(...this.newposts.slice(i+1));
                            break;
                        } 
                    }

                    if (this.user.username== "" || this.following.length == 0){
                        this.posts = this.newposts
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
        get_username: async function(i, arrayname) {
            if (arrayname=="newpost"){
                let response = await fetch("/api/user/"+ this.posts[i].userid);
                if (response.status == 200){
                    let result = await response.json();
                    this.posts[i].username = result.username;
                }
            }
            if (arrayname=="followpost"){
                let response = await fetch("/api/user/"+ this.followposts[i].userid);
                if (response.status == 200){
                    let result = await response.json();
                    this.followposts[i].username = result.username;
                }
            }
            
        },
    }
}

let userC = { 
    template: /*html*/ `
    <navbar v-on:updatedstate="this.check_followed"></navbar> 
    <div id="main">
    <div>
        <h1 style="display:inline-block;">Username: </h1> <input style="display:inline-block;" type="text" v-model="this.editUsername" v-if="this.showEditUser"/> <h1 v-else style="display:inline-block;">{{ $route.params.id }}</h1>
    </div>
    

        <div class="framed" id="user" :style="{'background-color':this.color}">
        
            <!-- <figure><img src="" alt="Profile_picture"></figure> -->
            <i class="fa fa-user-circle-o fa-5x" aria-hidden="true"></i>

            <div id="text">
                <h2>Bio</h2>
                <p v-if="this.showEditUser == false">{{ this.bio }}</p>
                <textarea v-else max-length="250" v-model="this.editbio"></textarea>
                <div v-if="this.loggedInUser.username!='' && this.loggedInUser.username!=$route.params.id.toLowerCase() ">
                    <button v-if="this.followed == false"  v-on:click="this.updatefollow">FOLLOW</button>
                    <button v-else v-on:click="this.updatefollow">UNFOLLOW</button>
                </div>
                
                <div v-if="this.loggedInUser.username==$route.params.id.toLowerCase()"> 
                    <div v-if="this.showEditUser == true"> 
                        <input type="color" v-model="this.color">
                        <button @click="this.showEditUser = false; this.color=this.prevcolor;"> Cancel </button>
                        <button @click="this.editUser"> Save </button>
                    </div>
                    
                    <div v-else> 
                        <button @click="this.showEditUser = true; this.editbio = this.bio;this.editUsername = $route.params.id; this.editlinks = {twitter: this.user.twitter, email: this.user.email};"> Edit account </button>
                        <button @click="this.deleteUser"> DELETE ACCOUNT </button>
                    </div>
                </div>
                <div v-if="this.showEditUser == false">
                    <a v-if="this.user.github != ''" :href="'http://www.github.com/' + this.user.github"><i class="fa fa-github"></i></a>
                    <a v-if="this.user.twitter != ''" :href="'http://www.twitter.com/' + this.user.twitter"><i class="fa fa-twitter"></i></a>
                    <a v-if="this.user.email != ''" :href="'mailto:' + this.user.email"><i class="fa fa-envelope"></i></a>
                </div>
                <div v-else>
                    <label>E-mail:</label> <br> <input type="text" name="email" v-model="editlinks.email"><br/>
                    <label>Twitter username:</label> <br> <input type="text" name="twitter" v-model="editlinks.twitter"><br/>
                </div>
            </div>
        </div>

        <br>
        <h3>Posts:</h3> 
        <i v-if="this.loggedInUser.username==$route.params.id.toLowerCase()" class="fa fa-plus-square fa-2x" aria-hidden="true" @click="this.showpostform = !this.showpostform"></i>
        <postformc v-if="this.showpostform"  v-on:newpost="this.newPost" :projects="this.projects" :userid="this.loggedInUser.userid"></postformc>

        <postc :style="{'background-color':this.color}" v-for="post, i in this.posts" v-on:deleted="this.deletePost" v-bind:editable="this.editable" :index="i" :date="post.date" :id="post.id" :projectid="post.projectid" :text="post.text" :type="post.type" :username="$route.params.id"></postc>
        <i v-if="this.loaded==false" class="fa fa-spinner fa-spin"></i>
        <span v-if="this.loaded == true && this.posts.length == 0">User has yet to post</span>

        <br>
        
        <h3>Projects:</h3> 
        <i v-if="this.loggedInUser.username==$route.params.id.toLowerCase()" class="fa fa-plus-square fa-2x" aria-hidden="true" @click="this.showprojectform = !this.showprojectform"></i>
        <projectformc v-if="this.showprojectform" v-on:newProject="this.newProject" :userid="this.loggedInUser.userid"></projectformc>

        <projectc :style="{'background-color':this.color}" v-for="project, i in this.projects" v-on:deleted="this.deleteProject" v-on:edited="this.edit" v-bind:index="i" v-bind:editable="this.editable" v-bind:name="project.name" v-bind:id="project.id" v-bind:created="project.created" v-bind:updated="project.updated" v-bind:description="project.description" v-bind:link="project.link" v-bind:private="project.private" :override="project.override"></projectc>
        <i v-if="this.loaded==false" class="fa fa-spinner fa-spin"></i>
        <span v-if="this.loaded == true && this.projects.length == 0">User has no projects</span>

        <div v-if="this.showedit" :style="{'background-color':this.color}">
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
            showEditUser: false,
            editbio: "",
            editUsername: "",
            editlinks: {twitter: "", email: ""},
            color: "#15181c",
            prevcolor: "#15181c",
            user: {github: "", twitter: "", email:""}
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
            // Get userid from params
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
                this.color = result.color;
                if(this.color != null){
                    this.prevcolor = result.color
                }
                this.user.github = result.github;
                this.user.twitter = result.twitter;
                this.user.email = result.email;
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

        newProject: function(data, postid) {
            // Updating client-side data
            let copy = JSON.parse(JSON.stringify(data));

            var currentdate = new Date(); 
            var datetime = currentdate.getFullYear() + "-"
                + (currentdate.getMonth()+1)  + "-" 
                + currentdate.getDate() + " "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
            copy.updated = datetime

            this.projects.push(copy);

            let post = {
                id: postid,
                userid: this.loggedInUser.userid,
                projectid: data.id,
                text: null,
                date: datetime,
                type: "created a new project"
            }
            this.posts.push(post)
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

            for (let i = 0; i < this.projects.length; i++) {
                if (this.projects[i].id == copy.projectid){
                    this.projects[i].updated = datetime;
                    break;
                }
                
                
            }
            
            this.posts.push(copy)
        },
        deletePost: function(index) {
            this.posts.splice(index, 1)
        },
        updatefollow: async function() {
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
                }   
            }
        },
        editUser: async function() {
            let response = await fetch("/api/user/" +  this.pageuserid, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "bio=" + this.editbio + "&username=" + this.editUsername + "&color=" + this.color  + "&twitter=" + this.editlinks.twitter  + "&email=" + this.editlinks.email 
            });
            if (response.status == 200){
                result = await response.json();
                if (result.errors.length != 0){
                    let text = ""
                    for (i in result.errors) {
                        text += result.errors[i] + "\n"
                    }
                    alert(text)
                }
                else{
                    this.showEditUser = false;
                    this.bio = this.editbio;
                    this.$route.params.id = this.editUsername;
                    state.user.username = this.editUsername;
                    this.prevcolor = this.color;
                    this.user.twitter = this.editlinks.twitter;
                    this.user.email = this.editlinks.email;
                
                }
            }
        }
    }  
};

let postsiteC = {
    template:/*html*/`
    <navbar></navbar>
    <div id=main> 
        <projectc :editable="false" :displayusername="true" :username="this.username" :name="this.projectname" :id="this.id" :created="this.created" :updated="this.updated" :description="this.description" :link="this.link"></projectc>
    </div>
    `,
    data: function() {
        return {
            projectname: "",
            id: this.$route.params.id,
            created: "",
            updated: "",
            description: "",
            link: "",
            username: "",
        }
    },
    created: function() {
        this.get_data()
    },
    methods:{
        get_data: async function(){
            let response = await fetch("/api/project/" + this.id);
            if (response.status == 200){
                let result = await response.json();
                this.projectname = result.name;
                this.created = result.created;
                this.updated = result.updated;
                this.description = result.description;
                this.link = result.link;

                let response2 = await fetch("/api/user/" + result.userid);
                if (response2.status == 200){
                    let result2 = await response2.json();
                    this.username = result2.username;
                }
            }
        }
    }
}