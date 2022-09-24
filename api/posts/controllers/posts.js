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
        const dateCreatedIn = formatDistanceToNow(
            posts[0].created_at,
            { locale: eoLocale }
        )
        let postChosen = {
            id: posts[0].id,
            text: posts[0].text,
            username: await strapi.services.userprofile.findOne({ id: posts[0].by.id }).then(result => {
                return result.userId.username
            }),
            created_at: dateCreatedIn,
            nbOfComments: posts[0].postComments.length,
            nbOfLikes: posts[0].postLikes.length,
            image: posts[0].images.url,
            profileLikedIt: isRequesterLikedThePost(profileId, posts[0]),
            profileFollowingPoster: await isRequesterFollowingPoster(profileId, posts[0].by.id),
            posterBadge: posts[0].by.badge,
            posterProfileImage: posts[0].by.photo.url
        }
        // return posts.map(entity => sanitizeEntity(entity, { model: strapi.models.posts }));
        return postChosen
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