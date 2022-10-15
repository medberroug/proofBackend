'use strict';
'use strict';
const { sanitizeEntity } = require('strapi-utils');
var formatDistanceToNow = require('date-fns/formatDistanceToNow')
const eoLocale = require('date-fns/locale/fr')
var parseISO = require('date-fns/parseISO')
var isPast = require('date-fns/isPast')
/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/v3.x/concepts/configurations.html#cron-tasks
 */

module.exports = {
  /**
   * Simple example.
   * Every monday at 1am.
   */
  '0,10,20,30,40,50 * * * *': async () => {
    console.log("Cron job started at: "+ new Date());
    let blogposts = await strapi.services.blogposts.find({ status: false });
    // console.log(blogposts);

    for (let i = 0; i < blogposts.length; i++) {
      if (isPast(parseISO(blogposts[i].publishTime))) {
        await strapi.services.blogposts.update({ id: blogposts[i].id }, {
          status: true
        });
        console.log("Blog Post id:" + blogposts[i].id + " was been published at " + new Date());
      }
    }

    // Posts scheduler: 
    let posts = await strapi.services.posts.find({ status: false });
    for (let i = 0; i < posts.length; i++) {
      if (isPast(parseISO(posts[i].publishTime))) {
        await strapi.services.posts.update({ id: posts[i].id }, {
          status: true
        });
        console.log("Community Post id:" + posts[i].id + " was been published at " + new Date());
      }
    }
    console.log("Cron job finished at: "+ new Date());
  }
};
