let app = Vue.createApp({
    template: /*html*/`
    <div v-for="project in this.projects">
    
        <div class="framed"> 
            <div id="text">
                <h2>{{ project.name }}</h2> 
                {{ project.description }}
                <br>
                <br>
                <span v-if="project.link!=null&&project.link!='None'"> Try it out: <a v-bind:href="project.link"> {{ project.link }} </a></span>
                <span v-if="project.website!=null&&project.private!=true"> <br> Source code: <a v-bind:href="project.website"> {{ project.website }} </a></span>
                <br>
                <br>
                <div>
                    <span>
                        Project started:
                        <span style="float: right;">
                            Last updated:
                            <br>
                            {{ project.updated }}
                        </span>
                        <br>
                        {{ project.created }}
                    </span>
                    
                </div>
            </div>
        </div>

    </div>
    `,
    data() { 
      return {
          projects: [],
      }
    },
    created: function() {
        this.get_data();
    },
    methods: {
        get_data: async function(){
            let response = await fetch("/serveProjects");
            if (response.status == 200){
                let result = await response.json();
                this.projects = result;
            }
        }
    }
  });
app.mount("#app");