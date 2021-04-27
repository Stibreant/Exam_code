let app = Vue.createApp({
    template: /*html*/`
    <div v-for="project in this.projects">
    
        <div class="framed"> 
            <div id="text">
                <h2>{{ project.name }}</h2> 
                {{ project.description }}        
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
                this.projects = result.slice(0,2);
            }
        
        }
    }
  });
app.mount("#app");
