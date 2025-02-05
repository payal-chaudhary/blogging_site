const blogModel = require("../model/blogModel");
const {
    isValid
} = require("./authorController");

// create blog api
const createBlog = async function(req, res) {
    try {
        const blog = req.body;
        if (Object.entries(blog).length == 0) {
            return res.status(400).send({
                status: false,
                msg: "data should be provided",
            });
        }
        if(blog.authorId==null){

        blog.authorId = req.token.authorId;

        if(!blog.title){
            return res.status(400).send({
                status: false,
                msg: "title is required"
            });
        }
        if (isValid(blog.title) == false) {
            return res.status(400).send({
                status: false,
                msg: "title is not valid"
            });
        }
        if(!blog.body){
            return res.status(400).send({
                status: false,
                msg: "body is required"
            });
        }
        if (isValid(blog.body) == false) {
            return res.status(400).send({
                status: false,
                msg: "body is not valid"
            });
        }

        if(!blog.category){
            return res.status(400).send({
                status: false,
                msg: "category is required"
            });
        }
        if (isValid(blog.category) === false) {
            return res.status(400).send({
                status: false,
                msg: "category is not valid"
            });
        }

        if (blog.isPublished == true) {
            blog.publishedAt = Date();
        }
        const saveBlog = await blogModel.create(blog);
        return res.status(201).send({
            status: true,
            data: saveBlog,
        });}
        if(blog.authorId != req.token.authorId){
            return res.status(400).send({ status:false,
                msg: "You can create blog only on your author_Id and If don't know your Author_Id then you not provide author_id we can get for you 😎"
            });
        }

    } catch (err) {
        return res.status(500).send({
            status: false,
            msg: err.message,
        });
    }
};

// get blog details api
const blogsDetails = async function(req, res) {
    try {
        let data = req.query;
        let filter = {
            $and: [{
                isDeleted: false,
                isPublished: true,
                ...data
            }]
        };
        // console.log(filter);
        let blogsPresent = await blogModel.find(filter)
        let n = blogsPresent.length

        if (blogsPresent.length === 0) {
            res.status(404).send({status:false,
                msg: "No blogs is present"
            })
        } else {
            res.status(200).send({
                status: true,
                data:blogsPresent, count:n
            })
        }

    } catch (error) {
        res.status(500).send({
            status: false,
            msg: error.message
        });
    }
};

//update blog api
const updateBlog = async function(req, res) {
    try {

        const filterQuery = req.body
        if (Object.entries(filterQuery).length == 0) {
            return res.send({
                status: false,
                msg: "Please provide details to be updated"
            })
        }


        const blogId = req.params.blogId;
        const isValidBlog = await blogModel.findById(blogId)

        if (isValidBlog.isDeleted == true) {
            return res.status(404).send({
                status: false,
                msg: "Blog Already Deleted"
            });
        }

        if (isValidBlog.isPublished == true) {
            return res.status(404).send({
                status: false,
                msg: "Blog is already published"
            });
        }

        if (isValid(filterQuery.title)) {
            filterQuery['title'] = filterQuery.title.trim()
        }
        if (isValid(filterQuery.body)) {
            filterQuery['body'] = filterQuery.body.trim()
        }

        if (isValid(filterQuery.tags)) {
            const tag = filterQuery.tags.split(',').map(tag => tag);
            filterQuery['tags'] = isValidBlog.tags.concat(tag)

        }

        if (isValid(filterQuery.subcategory)) {
            const subcat = filterQuery.subcategory.split(',').map(subcat => subcat);
            filterQuery['subcategory'] = isValidBlog.tags.concat(subcat)
        }
        filterQuery.isPublished = true;
        filterQuery.publishedAt = Date();

        const update_Blog = await blogModel.findOneAndUpdate({
            _id: blogId
        }, 
        filterQuery,
        {
            new: true
        });

        return res.status(200).send({
            status: true,
            data: update_Blog
        });

    } catch (err) {
        return res.status(500).send({
            status: false,
            msg: err.message
        });
    }
};

//delete blog by blogId
const deleteBlogByParams = async function(req, res) {
    try {
        let blogId = req.params.blogId;

        if (!blogId) {
            return res.status(404).send({
                status: false,
                msg: "Plz enter blog id"
            });
        }

        let checkBlogId = await blogModel.findById(blogId);

        if (!checkBlogId) {
            return res.status(404).send({
                status: false,
                msg: "Blog doesn't exist"
            });
        }
        if (checkBlogId.isDeleted == true) {
            return res.status(404).send({
                status: false,
                msg: "Blog already deleted"
            });
        }
        if (checkBlogId.isPublished == true) {
            return res.status(404).send({
                status: false,
                msg: "Blog already published"
            });
        }
        await blogModel.findOneAndUpdate({
            _id: blogId
        }, {
            $set: {
                isDeleted: true,
                deletedAt: Date(),
                publishedAt:""
            }
        });

        return res.status(200).send({
            status: true,
            msg: "Blog Deleted Succesfully"
        });

    } catch (err) {
        return res.status(500).send({
            msg: err.message
        });
    }
};

//delete blog by query
const deleteBlogByQuery = async function(req, res) {
    try {
        let data = req.query;
        let size = Object.entries(data).length;

        if (size < 1) {
            return res.status(400).send({
                status: false,
                msg: "Query params not given"
            });
        }
        data.isDeleted = false
        data.isPublished = false

        let deletedBlog = await blogModel.updateMany(data, {
            isDeleted: true,
            deletedAt: Date(),
            publishedAt:""
        });
        if (deletedBlog.modifiedCount == 0) {
            return res.status(404).send({
                status: false,
                msg: "blogs are already deleted"
            })
        }

        return res.status(200).send({
            status: true,
            msg: "Blog Deleted Succesfully"
        });

    } catch (err) {
        return res.status(500).send({
            status: false,
            msg: err.message
        });
    }
};

module.exports = {
    createBlog,
    blogsDetails,
    updateBlog,
    deleteBlogByParams,
    deleteBlogByQuery,
};