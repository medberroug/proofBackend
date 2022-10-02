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
    async getMyChildren(ctx) {
        const { id } = ctx.params;
        let myChildren;
        if (ctx.query._q) {
            myChildren = await strapi.services.children.search({ parent: id });
        } else {
            myChildren = await strapi.services.children.find({ parent: id });
        }

        myChildren = myChildren.map(entity => sanitizeEntity(entity, { model: strapi.models.children }));
        let myChildrenReturn = []

        for (let i = 0; i < myChildren.length; i++) {
            let dateBirthday = formatDistanceToNow(
                parseISO(myChildren[i].birthday),
                { locale: eoLocale }
            )
            for (let j = 0; j < myChildren[i].metrics.length; j++) {
                let x = []
                let y = []
                for (let p = 0; p < myChildren[i].metrics[j].data.length; p++) {
                    x.push(myChildren[i].metrics[j].data[p].when)
                    y.push(myChildren[i].metrics[j].data[p].value)
                }
                myChildren[i].metrics[j].xy = {
                    x: x,
                    y: y
                }
            }
            let newChild = {
                id: myChildren[i].id,
                firstName: myChildren[i].firstName,
                birthday: dateBirthday,
                gender: myChildren[i].gender,
                metrics: myChildren[i].metrics,
                bigImage: myChildren[i].bigImage ? myChildren[i].bigImage.url : null,
                photo: myChildren[i].photo ? myChildren[i].photo.url : null
            }
            myChildrenReturn.push(newChild)

        }
        // return posts.map(entity => sanitizeEntity(entity, { model: strapi.models.posts }));
        return myChildrenReturn
    },
    async updateMetric(ctx) {
        const { childId, metric } = ctx.params;
        let children = await strapi.services.children.findOne({ id: childId });
        for (let i = 0; i < children.metrics.length; i++) {
            if (children.metrics[i].metricName == metric) {
                let lastUpdate = new Date()
                children.metrics[i].push({
                    when: lastUpdate,
                    value: ctx.request.body.value
                })
                children.metrics[i].lastUpdate = lastUpdate
                children.metrics[i].lastValue = ctx.request.body.value
            }
        }

        return true
    },
    async newMetric(ctx) {
        const { childId} = ctx.params;
        let children = await strapi.services.children.findOne({ id: childId });
        let lastUpdate = new Date()
        children.metrics.push({
            metricName: ctx.request.body.metricName,
            lastUpdate: lastUpdate,
            lastValue: ctx.request.body.value,
            notation: ctx.request.body.notation,
            data: [{
                when : lastUpdate, 
                value: ctx.request.body.value
            }],
        })
        return true
    },
    async updatePhoto(ctx) {
        const { childId} = ctx.params;
        let children = await strapi.services.children.findOne({ id: childId });

        children.metrics.push({
            metricName: ctx.request.body.metricName,
            lastUpdate: lastUpdate,
            lastValue: ctx.request.body.value,
            notation: ctx.request.body.notation,
            data: [{
                when : lastUpdate, 
                value: ctx.request.body.value
            }],
        })
        return true
    },
};
