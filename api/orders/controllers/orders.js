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
        console.log(productId);
        console.log(clientId);
        console.log(quantity);
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
        await strapi.services.orders.create(newDraft);
        return true
    },
    async pedningOrdersForClient(ctx) {
        let { clientId } = ctx.params
        let pendingOrders = await strapi.services.orders.find({
            client: clientId
        });
        for (let i = 0; i < pendingOrders.length; i++) {
            let latestStatus = pendingOrders[i].status.reverse()
            if (latestStatus[0].name == "draft") {
                return pendingOrders[i]
            }
        }
        return null

    },
    async productAlreadyInCart(ctx) {
        let { clientId, productId } = ctx.params
        let pendingOrders = await strapi.services.orders.find({
            client: clientId
        });
        for (let i = 0; i < pendingOrders.length; i++) {
            let latestStatus = pendingOrders[i].status.reverse()
            if (latestStatus[0].name == "draft") {
                for (let j = 0; j < pendingOrders[i].items.length; j++) {
                    if (pendingOrders[i].items[j].productId.id == productId) {
                        return true
                    }
                }
            }
        }
        return false

    },
    async addItemToOrder(ctx) {
        let PendingOrderFound
        let productId = ctx.request.body.productId
        let quantity = ctx.request.body.quantity
        let clientId = ctx.request.body.clientId
        let product = await strapi.services.products.findOne({ id: productId });
        let taxselling = await strapi.services.tax.find();
        taxselling = taxselling.sellingtax
        let pendingOrders = await strapi.services.orders.find({
            client: clientId
        });
        for (let i = 0; i < pendingOrders.length; i++) {
            let latestStatus = pendingOrders[i].status.reverse()
            if (latestStatus[0].name == "draft") {
                PendingOrderFound = pendingOrders[i]
                break
            }
        }
        if (PendingOrderFound) {
            let order = PendingOrderFound
            order.items.push({
                productId: productId,
                quantity: quantity,
                up: product.discount ? product.up - product.up * product.discount / 100 : product.up,
                subTotal: product.discount ? (product.up - product.up * product.discount / 100) * quantity : product.up * quantity
            })
            productUp = product.discount ? product.up - product.up * product.discount / 100 : product.up
            order.subtotal = order.subTotal + (productUp * quantity) / (1 + taxselling / 100)
            order.tax = order.tax + productUp * (taxselling / 100)
            order.total = order.subtotal + order.tax
            await strapi.services.orders.update({
                subTotal: order.subTotal,
                total: order.total,
                items: order.items
            });
            return true
        }
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
        await strapi.services.orders.create(newDraft);
        return true
    },

};