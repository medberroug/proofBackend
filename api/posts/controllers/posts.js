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
                created_at: dateCreatedIn,
                nbOfComments: posts[i].postComments.length,
                nbOfLikes: posts[i].postLikes.length,
                image: posts[i].images ? posts[i].images.url : null,
                profileLikedIt: isRequesterLikedThePost(profileId, posts[i]),
                profileFollowingPoster: await isRequesterFollowingPoster(profileId, posts[i].by.id),
                posterBadge: posts[i].by.badge,
                posterProfileImage: posts[i].by.photo ? posts[i].by.photo.url : null
            }
            postsReturned.push(postChosen)

        }
        // return posts.map(entity => sanitizeEntity(entity, { model: strapi.models.posts }));
        return postsReturned
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