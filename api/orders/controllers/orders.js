'use strict';
const { sanitizeEntity } = require('strapi-utils');
var formatDistanceToNow = require('date-fns/formatDistanceToNow')
const eoLocale = require('date-fns/locale/fr')
var parseISO = require('date-fns/parseISO')
var format = require('date-fns/format')
var getDay = require('date-fns/getDay')
var addHours = require('date-fns/addHours')
var setHours = require('date-fns/setHours')
var addDays = require('date-fns/addDays')
var isAfter = require('date-fns/isAfter')
var isBefore = require('date-fns/isBefore')
var setMinutes = require('date-fns/setMinutes')

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
                return {
                    result: true,
                    data: pendingOrders[i]
                }
            }
        }
        return {
            result: false,
            data: null
        }

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
    async ongoingOrdersForClient(ctx) {
        let { clientId } = ctx.params
        let pendingOrders = await strapi.services.orders.find({
            client: clientId
        });
        let resultListOfPendingOrders = []
        for (let i = 0; i < pendingOrders.length; i++) {
            let latestStatus = pendingOrders[i].status.reverse()
            if (latestStatus[0].name == "created" || latestStatus[0].name == "validated" || latestStatus[0].name == "shipped") {
                resultListOfPendingOrders.push(pendingOrders[i])
                break
            }
        }
        if (resultListOfPendingOrders.length > 0) {
            return resultListOfPendingOrders
        }
        return null
    },
    async removeItemFromPendingOrder(ctx) {
        let { clientId, productId } = ctx.params
        let selectedOrder
        let pendingOrders = await strapi.services.orders.find({
            client: clientId
        });
        for (let i = 0; i < pendingOrders.length; i++) {
            let latestStatus = pendingOrders[i].status.reverse()
            if (latestStatus[0].name == "draft") {
                selectedOrder = pendingOrders[i]
            }
        }
        for (let j = 0; j < selectedOrder.items.length; j++) {
            if (selectedOrder.items[j].productId.id == productId) {
                selectedOrder.items.splice(j, 1)
            }
        }
        await strapi.services.orders.update({ id: selectedOrder.id }, {
            items: selectedOrder.items
        });
        return true

    },
    async getShippingTime(ctx) {
        // let { clientId, productId } = ctx.params
        let selectedOrder
        let securityHours = 2
        let shippingTime = await strapi.services["shipping-time"].find();
        shippingTime = shippingTime.weekdays
        let now = new Date()
        let nowDayOfTheWeek = getDay(now)
        let DayAdds = 0
        let cursor
        for (let i = 0; i < shippingTime.length; i++) {
            if (shippingTime[i].dayCode == nowDayOfTheWeek) {
                cursor = i
            }
        }
        let newList = []
        for (let i = cursor; i < shippingTime.length; i++) {
            newList.push(shippingTime[i])
        }
        for (let i = 0; i < cursor; i++) {
            newList.push(shippingTime[i])
        }
        console.log(newList);
        let newHourForToday = new Date()
        newHourForToday = addHours(newHourForToday, 2)
        console.log(newList[0].timeFrames);
        for (let i = 0; i < newList[0].timeFrames.length; i++) {
            let startHour = setHours(new Date(), newList[0].timeFrames[i].startHour)
            startHour = setMinutes(startHour, 0)
            let endHour = setHours(new Date(), newList[0].timeFrames[i].startHour + 1)
            endHour = setMinutes(endHour, 0)
            console.log(startHour);
            console.log(endHour);
            if (isBefore(newHourForToday, startHour)) {
                return {
                    result: true,
                    data: [{
                        date: startHour,
                        textDate: format(startHour, "EEEE d LLL yyyy - HH:mm", {
                            locale: eoLocale
                        }) + format(endHour, " 'et' HH:mm", {
                            locale: eoLocale
                        })
                    }]
                }
            }
        }
        for (let i = 1; i < newList.length; i++) {
            if (newList[i].timeFrames.length) {
                let startHour = setHours(new Date(), newList[i].timeFrames[0].startHour)
                startHour = addDays(startHour, i)
                startHour = setMinutes(startHour, 0)
                let endHour = addHours(startHour, 1)
                endHour = setMinutes(endHour, 0)
                return {
                    result: true,
                    data: [{
                        date: startHour,
                        textDate: format(startHour, "EEEE d LLL yyyy - HH:mm", {
                            locale: eoLocale
                        }) + format(endHour, " 'et' HH:mm", {
                            locale: eoLocale
                        })
                    }]
                }
            }
        }
        return {
            result : false, 
            date : null
        }


    },



};
