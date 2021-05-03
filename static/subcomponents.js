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
               
                state.user.username = result.username;
                state.user.userid = result.userid;
                this.$emit("updatedstate")
                
                
          }
    },
    methods: {
        logout: async function() {
            let response = await fetch("/api/session", {
                method: "DELETE"
            });
            if (response.status == 200){
                state.user.username = "";
                state.user.userid = "";
                this.$emit("loggedout")
            }
        }
    }
};

let postC = {
    props:{
        editable: {default: false},
        id: {},
        username: {},
        text: {},
        type: {},
        projectid: {},
    },
    template: /*html*/`
    <div class="framed"> 
        <div id="text">
            <h2>{{ this.username }} {{this.type}} {{ this.projectname }}</h2> 
            
            {{ this.text }}

            <br>
            <div v-if="this.editable==true">
                <button v-on:click="$emit('edited', this.id, this.name, this.created, this.description, this.link, this.private, this.index)">EDIT</button>
                <button v-on:click="this.delete">DELETE</button>

                <label class="switch" style="float: right;">
                    <input type="checkbox" checked>
                    <span class="slider round"></span>
                </label>
            </div>
        </div>
    </div>
    `,
    data: function () {
        return {
          projectname: "",
        }
      },
    created: function() {
        this.get_data()
    },
    methods: {
        get_data: async function() {
            let response = await fetch("/api/project/" + this.projectid);
              if (response.status == 200){
                  let result = await response.json();
                  this.projectname = result.name;
                  console.log(result);
              }
        },
    },
}

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

                    <label class="switch" style="float: right;">
                        <input type="checkbox" checked>
                        <span class="slider round"></span>
                    </label>
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

let searchC = {
template: /*html*/`
<div>
    <input type="text" autocomplete="off" v-model="this.search" style ="margin-top: 20px;" @input="this.filter()" @focus="this.focus" @focusout="this.focusout" id="search" placeholder="search">
    <select id="select">
        <option>Users</option>
        <option>Projects</option>
    </select>

    <div v-if="this.show==true" id="searchlist">
        <div v-for="element, i in this.data">
        <a  :href="'/#/user/' + element">{{ element }}</a>
        <br>
        </div>
        
    </div>
</div>


`,
data: function () {
    return {
      data: [],
      search: "",
      show: true,
    }
  },

methods: {
    focus: async function() {
        //console.log("Focus");
        this.show=true;
        if (this.data.length == 0) {
            let response = await fetch("/api/users");
            if (response.status == 200){    
                let result = await response.json();
                this.data = result.result;
                //console.log(this.data);
          }
        }
    },
    focusout: async function() {
        await new Promise((res) => setTimeout(res, 250));
        this.show=false;
    },
    filter: function() {
        var input, filter, table, i, txtValue, elements;
        input = this.search;
        filter = input.toUpperCase();
        table = document.getElementById("searchlist");
        elements = Array.from(table.children);
        console.log(table)

        // Loop through all elements, and hide those who don't match the search query
        for (i = 0; i < elements.length; i++) {
            
            // Loop through the searchable values, if the element should be displayed break the loop and show element. If no text match hide it
            if (this.data[i].toUpperCase().indexOf(filter) > -1) {
                elements[i].style.display = "";
            } else {
                elements[i].style.display = "none";
            }
        }
    }
}
};