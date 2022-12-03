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
    async draftNewOrder(ctx) {
        let productId = ctx.request.body.productId
        let clientId = ctx.request.body.clientId
        let quantity = ctx.request.body.quantity
        let product = await strapi.services.products.findOne({ id: productId });
        let taxselling = await strapi.services.tax.find();
        taxselling = taxselling.sellingtax
        let newDraft = {
            client: {
                id: clientId,
            },
            items: [{
                productId: productId,
                quantity: quantity,
                up: product.discount ? product.up - product.up * product.discount / 100 : product.up,
                subTotal: product.discount ? (product.up - product.up * product.discount / 100) * quantity : product.up * quantity
            }],
            status: [{
                name: "draft",
                date: new Date()
            }],
            subTotal: product.discount ? (product.up - product.up * product.discount / 100) * quantity / (1 + taxselling / 100) : product.up * quantity / (1 + taxselling / 100),
            tax: product.discount ? (product.up - product.up * product.discount / 100) * quantity * (taxselling / 100) : product.up * quantity * (taxselling / 100),
            total: product.discount ? (product.up - product.up * product.discount / 100) * quantity : product.up * quantity,

        }
        await strapi.services.orders.create({
            newDraft
        });
        return true
    },
};