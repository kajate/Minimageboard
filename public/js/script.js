new Vue({
    el: "main",
    data: {
        chooseFile: "CHOOSE FILE",
        imgFormInfo: {
            title: "",
            description: "",
            username: "",
            img: null
                    },
        images: [],
        currentImageId: location.hash.slice(1),
        menuOpen: false,
    },
    methods: {
        selectFile: function(e) {
            this.imgFormInfo.img = e.target.files[0];
            this.chooseFile = "1 FILE CHOSEN";
        },
        uploadImage: function(e) {
            e.preventDefault();
            var fd = new FormData();
            fd.append("title", this.imgFormInfo.title);
            fd.append("description", this.imgFormInfo.description);
            fd.append("username", this.imgFormInfo.username);
            fd.append("file", this.imgFormInfo.img);
            axios.post("/upload", fd).then(resp => {
                this.images.unshift(resp.data.image);
                this.imgFormInfo.title = "";
                this.imgFormInfo.description = "";
                this.imgFormInfo.username = "";
                this.chooseFile = "CHOOSE FILE";
                this.$refs.fileInput.type = "text";
                this.$refs.fileInput.type = "file";
            });
        },
        openModal: function(e) {
            this.classList('up')
            console.log(e);
            this.currentImageId = e;
        },
        closeModal: function(e) {
            console.log(e);
            this.currentImageId = null;
            location.hash = "";
        },
        toggleMenu: function(e) {
            this.menuOpen = !this.menuOpen;
        },
        moreImages: function() {
           var self = this;
           var lastImageId = self.images[self.images.length - 1];
           console.log(self.images[self.images.length - 1]);
           axios.get("/images/" + lastImageId.id).then(function(resp) {
               self.images = self.images.concat(resp.data.images);
           });
       }
    },
    mounted: function() {
        var self = this;
        axios.get("/images").then(function(resp) {
            self.images = resp.data.images;
        });
        addEventListener("hashchange", function() {
            console.log("hashchange");
            self.currentImageId = location.hash.slice(1);
            // element.classList.add("openModal");
        });
    },
    watch: {
        id: function() {
            axios.get('/image/' + this.id)
        }
    }
});

Vue.component("image-modal", {
    data: function() {
        return {
            currentImage: {},
            commentForm: {
                commenter: "",
                comment: ""
            },
            comments: []
        };
    },
    props: ["id"],
    methods: {
        closeMe: function(e) {
            this.$emit("close");
        },
        submitComment: function(e) {
            e.preventDefault();
            var self = this;
            axios
                .post("/comments", {
                    image_id: self.id,
                    commenter: self.commentForm.commenter,
                    comment: self.commentForm.comment
                })
                .then(result => {
                    self.comments.unshift(result.data.newComment);
                    self.commentForm.commenter = "";
                    self.commentForm.comment = "";
                });
        }
    },
    watch: {
        id: function() {
            var self = this;
            axios.get("/image/" + this.id).then(function(results) {
                self.currentImage = results.data.currentImage;
            });
            axios.get("/comments/" + this.id).then(function(results) {
                self.comments = results.data.comments;
            });
        }
    },
    template: "#image-modal-template",
    mounted: function() {
        console.log(this.id);
        console.log(this);
        var self = this;
        axios.get("/image/" + this.id).then(function(results) {
            self.currentImage = results.data.currentImage;
        });
        axios.get("/comments/" + this.id).then(function(results) {
            self.comments = results.data.comments;
        });
        // make db query to images table based on image ID to get all other image data
        // make db query to comment table
        //
    }
});
