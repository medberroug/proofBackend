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
                    return result.userId.username
                }),
                posterId: posts[i].by.id,
                created_at: dateCreatedIn,
                nbOfComments: posts[i].postComments.length,
                nbOfLikes: posts[i].postLikes.length,
                image: posts[i].images ? process.env.serverUrl + posts[i].images.url : null,
                profileLikedIt: isRequesterLikedThePost(profileId, posts[i]),
                profileFollowingPoster: await isRequesterFollowingPoster(profileId, posts[i].by.id),
                posterBadge: posts[i].by.badge,
                posterProfileImage: posts[i].by.photo ? process.env.serverUrl + posts[i].by.photo.url : null
            }
            postsReturned.push(postChosen)

        }
        // return posts.map(entity => sanitizeEntity(entity, { model: strapi.models.posts }));
        return postsReturned
    },

    async followPoster(ctx) {
        const { posterId, followerId, action } = ctx.params;
        let followerUserProfile = await strapi.services.userprofile.findOne({ id: followerId });

        let alreadyFollowed = false
        let indexOfFollowing = 0
        for (let i = 0; i < followerUserProfile.following.length; i++) {
            if (followerUserProfile.following[i].userprofile.id == followerId) {
                alreadyFollowed = true
                indexOfFollowing = i
                break
            }
        }
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
        console.log("postId"+postId);
        console.log("likedProfileId"+likedProfileId);
        console.log("action"+action);
        let alreadyLiked = false
        let indexOfLiking = 0
        for (let i = 0; i < post.postLikes.length; i++) {
            if (post.postLikes[i].by.id == likedProfileId) {
                alreadyLiked = true
                indexOfLiking = i
                break
            }
        }
        console.log("action"+action);
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