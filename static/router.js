let router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        { path: "/", component: homeC},
        { path: "/login", component: loginformC},
        { path: "/user/:id", components: 
                                        {
                                            default: userC,
                                        }},
        { path: "/register", component: registerC},
        { path: "/project/:id", component: postsiteC}
    ]
})