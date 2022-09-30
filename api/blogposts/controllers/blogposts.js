'use strict';
const { sanitizeEntity } = require('strapi-utils');
var formatDistanceToNow = require('date-fns/formatDistanceToNow')
const eoLocale = require('date-fns/locale/fr')
var parseISO = require('date-fns/parseISO')
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async blogPostsByCategories(ctx) {
        // const { profileId } = ctx.params;
        let blogposts;
        if (ctx.query._q) {
            blogposts = await strapi.services.blogposts.search({ status: true });
        } else {
            blogposts = await strapi.services.blogposts.find({ status: true });
        }

        blogposts = blogposts.map(entity => sanitizeEntity(entity, { model: strapi.models.blogposts }));
        let categoriesByPost = []
        let categoriesList = await strapi.services.categories.find();
        categoriesList = categoriesList.category
        let categories = []
        for (let m = 0; m < categoriesList.length; m++) {
            let newCategory = {
                name: categoriesList[m].name,
                id: categoriesList[m].id,
                blogPosts: [],
                rank: categoriesList[m].rank
            }
            categories.push(newCategory)
        }

        for (let i = 0; i < blogposts.length; i++) {
            var dateCreatedIn = formatDistanceToNow(
                blogposts[i].created_at,
                { locale: eoLocale }
            )
            let newBlogPost = {
                id: blogposts[i].id,
                badge: blogposts[i].badge,
                title: blogposts[i].title,
                nbOfLikes: blogposts[i].blogPostLikes.length,
                nbOfComments: blogposts[i].blogPostComments.length,
                when: dateCreatedIn,
                image: blogposts[i].images ? blogposts[i].images[0].url : null,
                category: blogposts[i].category
            }
            for (let j = 0; j < categories.length; j++) {
                if (categories[j].name == newBlogPost.category) {
                    categories[j].blogPosts.push(newBlogPost)
                }
            }
        }

        categories.sort(function (a, b) {
            return a.rank - b.rank;
        })
        for (let p = 0; p < categories.length; p++) {
            if (categories[p].blogPosts.length == 0) {
                categories.splice(p, 1)
            }
        }
        return categories
    },
    async blogPostsbyOneCategory(ctx) {
        const { categoryName } = ctx.params;
        let blogposts;
        if (ctx.query._q) {
            blogposts = await strapi.services.blogposts.search({ status: true });
        } else {
            blogposts = await strapi.services.blogposts.find({ status: true });
        }
        blogposts = blogposts.map(entity => sanitizeEntity(entity, { model: strapi.models.blogposts }));
        let blogPostsToBeReturned = []
        for (let i = 0; i < blogposts.length; i++) {
            if (blogposts[i].category == categoryName) {
                var dateCreatedIn = formatDistanceToNow(
                    blogposts[i].created_at,
                    { locale: eoLocale }
                )
                let newBlogPost = {
                    id: blogposts[i].id,
                    badge: blogposts[i].badge,
                    title: blogposts[i].title,
                    nbOfLikes: blogposts[i].blogPostLikes.length,
                    nbOfComments: blogposts[i].blogPostComments.length,
                    when: dateCreatedIn,
                    image: blogposts[i].images ? blogposts[i].images[0].url : null,
                    category: blogposts[i].category
                }
                blogPostsToBeReturned.push(newBlogPost)
            }

        }

        return blogPostsToBeReturned
    },
    async blogPost(ctx) {
        const { id } = ctx.params;
        let blogpost = await strapi.services.blogposts.findOne({ id });
        let blogPostComments = []
        for (let j = 0; j < blogpost.blogPostComments.length; j++) {
            let commentDate = formatDistanceToNow(
                new Date(blogpost.blogPostComments[j].when),
                { locale: eoLocale }
            )
            let newblogPostComment = {
                username: await strapi.services.userprofile.findOne({ id: blogpost.blogPostComments[j].by.id }).then(result => {
                    return result.userid.username
                }),
                when: commentDate,
                profileImage: blogpost.blogPostComments[j].by.photo.url,
                comment: blogpost.blogPostComments[j].text,
                badge: blogpost.blogPostComments[j].by.badge
            }
            blogPostComments.push(newblogPostComment)
        }
        blogPostComments
        let dateCreatedIn = formatDistanceToNow(
            new Date(blogpost.created_at),
            { locale: eoLocale }
        )
        let newBlogPost = {
            id: blogpost.id,
            badge: blogpost.badge,
            text: blogpost.text,
            title: blogpost.title,
            nbOfLikes: blogpost.blogPostLikes.length,
            nbOfComments: blogpost.blogPostComments.length,
            when: dateCreatedIn,
            image: blogpost.images ? blogpost.images[0].url : null,
            category: blogpost.category,
            blogPostComments: blogPostComments
        }

        return newBlogPost
    },
    async commentOnBlogPost(ctx) {
        const { id, commenterId } = ctx.params;
        let blogPost = await strapi.services.blogposts.findOne({ id: id });
        blogPost.blogPostComments.push({
            by: {
                id: commenterId
            },
            when: new Date(),
            text: ctx.request.body.text,
        })
        let blogPostComments = blogPost.blogPostComments
        await strapi.services.blogposts.update({ id: id }, {
            blogPostComments: blogPostComments
        });
        return true
    },
    async likeABlogPost(ctx) {
        const { id, likedProfileId, action } = ctx.params;
        let blogpost = await strapi.services.blogposts.findOne({ id: id });
        let alreadyLiked = false
        let indexOfLiking = 0
        for (let i = 0; i < blogpost.blogPostLikes.length; i++) {
            if (blogpost.blogPostLikes[i].by.id == likedProfileId) {
                alreadyLiked = true
                indexOfLiking = i
                break
            }
        }
        console.log("action" + action);
        if (!alreadyLiked) {

            blogpost.blogPostLikes.push({
                by: {
                    id: likedProfileId
                },
                when: new Date()
            })
            let blogPostLikes = blogpost.blogPostLikes
            await strapi.services.blogposts.update({ id }, {
                blogPostLikes: blogPostLikes
            });
            return true

        } else if ( alreadyLiked) {
            blogpost.blogPostLikes.splice(indexOfLiking, 1)
            let blogPostLikes = blogpost.blogPostLikes
            await strapi.services.blogposts.update({ id }, {
                blogPostLikes: blogPostLikes
            });
            return true
        }


        return false
    },
};
