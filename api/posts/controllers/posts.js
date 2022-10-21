'use strict';
const { sanitizeEntity } = require('strapi-utils');
var formatDistanceToNow = require('date-fns/formatDistanceToNow')
const eoLocale = require('date-fns/locale/fr')
var parseISO = require('date-fns/parseISO')
const base64 = require('node-base64-image');
const axios = require('axios')
const FormData = require('form-data');
var File = require("file-class");

const uploader = require('../../../helpers/uploader');
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async getAllPosts(ctx) {
        const { profileId } = ctx.params;
        let posts;
        if (ctx.query._q) {
            posts = await strapi.services.posts.search({ status: true });
        } else {
            posts = await strapi.services.posts.find({ status: true });
        }

        posts = posts.map(entity => sanitizeEntity(entity, { model: strapi.models.posts }));
        console.log(posts)
        let postsReturned = []

        for (let i = 0; i < posts.length; i++) {
            const dateCreatedIn = formatDistanceToNow(
                posts[i].created_at,
                { locale: eoLocale }
            )
            let postChosen = {
                id: posts[i].id,
                text: posts[i].text,
                username: await strapi.services.userprofile.findOne({ id: posts[i].by.id }).then(result => {
                    return result.userid.username
                }),
                posterId: posts[i].by.id,
                created_at: dateCreatedIn,
                nbOfComments: posts[i].postComments.length,
                nbOfLikes: posts[i].postLikes.length,
<<<<<<< HEAD
                image: posts[i].images ? posts[i].images.url : null,
                profileLikedIt: isRequesterLikedThePost(profileId, posts[i]),
                profileFollowingPoster: await isRequesterFollowingPoster(profileId, posts[i].by.id),
                posterBadge: posts[i].by.badge,
                posterProfileImage: posts[i].by.photo ? posts[i].by.photo.url : "/uploads/Asset_17_b7f5d7bdbc.png?6433737.100000024"
=======
                image: posts[i].images ?  posts[i].images.url : null,
                profileLikedIt: isRequesterLikedThePost(profileId, posts[i]),
                profileFollowingPoster: await isRequesterFollowingPoster(profileId, posts[i].by.id),
                posterBadge: posts[i].by.badge,
                posterProfileImage: posts[i].by.photo ?  posts[i].by.photo.url : null
>>>>>>> bb5bc67aebf36327273c0c7292dffe3b803e7d8a
            }
            postsReturned.push(postChosen)

        }
        // return posts.map(entity => sanitizeEntity(entity, { model: strapi.models.posts }));
        return postsReturned.reverse()
    },
    async getAllPostsForAdmin(ctx) {

        let posts;
        if (ctx.query._q) {
            posts = await strapi.services.posts.search();
        } else {
            posts = await strapi.services.posts.find();
        }

        posts = posts.map(entity => sanitizeEntity(entity, { model: strapi.models.posts }));
        console.log(posts)
        let postsReturned = []

        for (let i = 0; i < posts.length; i++) {
            const dateCreatedIn = formatDistanceToNow(
                posts[i].created_at,
                { locale: eoLocale }
            )
            let postChosen = {
                id: posts[i].id,
                text: posts[i].text,
                username: await strapi.services.userprofile.findOne({ id: posts[i].by.id }).then(result => {
                    return result.userid.username
                }),
                posterId: posts[i].by.id,
                created_at: dateCreatedIn,
                nbOfComments: posts[i].postComments.length,
                nbOfLikes: posts[i].postLikes.length,
                image: posts[i].images ? posts[i].images.url : null,
                // profileLikedIt: isRequesterLikedThePost(profileId, posts[i]),
                // profileFollowingPoster: await isRequesterFollowingPoster(profileId, posts[i].by.id),
                posterBadge: posts[i].by.badge,
                posterProfileImage: posts[i].by.photo ? posts[i].by.photo.url : null
            }
            postsReturned.push(postChosen)

        }
        // return posts.map(entity => sanitizeEntity(entity, { model: strapi.models.posts }));
        return postsReturned.reverse()
    },
    async getPost(ctx) {
        const { profileId, postId } = ctx.params;
        let post = await strapi.services.posts.findOne({ status: true, id: postId });
        console.log(post)
        const dateCreatedIn = formatDistanceToNow(
            post.created_at,
            { locale: eoLocale }
        )
        let postCommentsList = []
        for (let j = 0; j < post.postComments.length; j++) {
            let commentDate = formatDistanceToNow(
                new Date(post.postComments[j].when),
                { locale: eoLocale }
            )
            if (!post.postComments[j].by.blocked) {
                let oneComment = {
                    id: post.postComments[j].id,
                    text: post.postComments[j].text,
                    username: await strapi.services.userprofile.findOne({ id: post.postComments[j].by.id }).then(result => {
                        return result.userid.username
                    }),
                    commenterId: post.postComments[j].by.id,
                    profilePhoto: await strapi.services.userprofile.findOne({ id: post.postComments[j].by.userprofileId }).then(result => {
                        return result.photo ? result.photo.url : null
                    }),
                    when: commentDate,
                    badge: await strapi.services.userprofile.findOne({ id: post.postComments[j].by.userprofileId }).then(result => {
                        return result.badge
                    }),
                }
                postCommentsList.push(oneComment)
            }
        }
        postCommentsList
        let postChosen = {
            id: post.id,
            text: post.text,
            username: await strapi.services.userprofile.findOne({ id: post.by.id }).then(result => {
                return result.userid.username
            }),
            posterId: post.by.id,
            created_at: dateCreatedIn,
            nbOfComments: post.postComments.length,
            nbOfLikes: post.postLikes.length,
            image: post.images ?  post.images.url : null,
            profileLikedIt: isRequesterLikedThePost(profileId, post),
            profileFollowingPoster: await isRequesterFollowingPoster(profileId, post.by.id),
            posterBadge: post.by.badge,
            posterProfileImage: post.by.photo ? post.by.photo.url : null,
            postComments: postCommentsList
        }
        return postChosen
    },

    async followPoster(ctx) {
        const { posterId, followerId, action } = ctx.params;
        let followerUserProfile = await strapi.services.userprofile.findOne({ id: followerId });

        let alreadyFollowed = false
        let indexOfFollowing = 0
        for (let i = 0; i < followerUserProfile.following.length; i++) {
            if (followerUserProfile.following[i].userprofile.id == posterId) {
                alreadyFollowed = true
                indexOfFollowing = i
                break
            }
        }
        console.log(alreadyFollowed);
        if (action == "follow" && !alreadyFollowed) {

            followerUserProfile.following.push({
                userprofile: {
                    id: posterId
                },
                when: new Date()
            })
            let followingNewList = followerUserProfile.following
            await strapi.services.userprofile.update({ id: followerId }, {
                following: followingNewList
            });
            return true

        } else if (action == "unfollow" && alreadyFollowed) {
            followerUserProfile.following.splice(indexOfFollowing, 1)
            let followingNewList = followerUserProfile.following
            await strapi.services.userprofile.update({ id: followerId }, {
                following: followingNewList
            });
            return true
        }


        return false
    },

    async likeAPost(ctx) {
        const { postId, likedProfileId, action } = ctx.params;
        let post = await strapi.services.posts.findOne({ id: postId });
        console.log("postId" + postId);
        console.log("likedProfileId" + likedProfileId);
        console.log("action" + action);
        let alreadyLiked = false
        let indexOfLiking = 0
        for (let i = 0; i < post.postLikes.length; i++) {
            if (post.postLikes[i].by.id == likedProfileId) {
                alreadyLiked = true
                indexOfLiking = i
                break
            }
        }
        console.log("action" + action);
        if (action == "like" && !alreadyLiked) {

            post.postLikes.push({
                by: {
                    id: likedProfileId
                },
                when: new Date()
            })
            let postLikes = post.postLikes
            await strapi.services.posts.update({ id: postId }, {
                postLikes: postLikes
            });
            return true

        } else if (action == "unlike" && alreadyLiked) {
            post.postLikes.splice(indexOfLiking, 1)
            let postLikes = post.postLikes
            await strapi.services.posts.update({ id: postId }, {
                postLikes: postLikes
            });
            return true
        }


        return false
    },
    async commentOnPost(ctx) {
        const { postId, commenterId } = ctx.params;
        let post = await strapi.services.posts.findOne({ id: postId });
        post.postComments.push({
            by: {
                id: commenterId
            },
            when: new Date(),
            text: ctx.request.body.text,
        })
        let postComments = post.postComments
        await strapi.services.posts.update({ id: postId }, {
            postComments: postComments
        });
        return true

    },
    async uploadimage64(ctx) {
        // const { postId, commenterId } = ctx.params;
        // ctx.request.body.base
        // let post = await strapi.services.posts.findOne({ id: postId });
        let base = ctx.request.body.base
        let fd = new FormData();
        // fd = {
        //     name: JSON.stringify( { first: 'Saeid', last: 'Alidadi' } )
        //   }
        let myimage = await base64.decode(base, { fname: 'example', ext: 'jpeg' });

        // let file = new File([base], "filename.jpeg");
        fd.append('image', myimage);
        // fd.append('image', file)
        let myImage = await axios
            .post("http://localhost:1337/upload", fd)

        return true

    }, async uploadImageTest(ctx) {

        let url = ctx.request.body.url
        const img = await uploader.uploadToLibrary(url);
        console.log(img)
        return img

    },


};

function isRequesterLikedThePost(profileId, post) {
    let postLikes = post.postLikes
    for (let i = 0; i < postLikes.length; i++) {
        if (postLikes[i].by.id == profileId) {
            return true
        }
    }
    return false
}
async function isRequesterFollowingPoster(profileId, creatorProfileId) {
    let RequesterProfile = await strapi.services.userprofile.findOne({ id: profileId });
    for (let i = 0; i < RequesterProfile.following.length; i++) {
        if (RequesterProfile.following[i].userprofile.id == creatorProfileId) {
            return true
        }
    }
    return false
}