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
    async getProductsForHome(ctx) {
        // const { profileId } = ctx.params;
        let products;
        if (ctx.query._q) {
            products = await strapi.services.products.search({ status: true });
        } else {
            products = await strapi.services.products.find({ status: true });
        }

        products = products.map(entity => sanitizeEntity(entity, { model: strapi.models.products }));
        let categoriesList = await strapi.services.productcategories.find();
        categoriesList=categoriesList.category
        let categories = []
        for (let m = 0; m < categoriesList.length; m++) {
            let newCategory = {
                name: categoriesList[m].name,
                id: categoriesList[m].id,
                products: [],
                rank: categoriesList[m].rank
            }
            categories.push(newCategory)
        }

        for (let i = 0; i < products.length; i++) {
            var dateCreatedIn = formatDistanceToNow(
                products[i].created_at,
                { locale: eoLocale }
            )
            let newProduct = {
                id: products[i].id,
                name: products[i].name,
                discountedPrice: products[i].discount ? products[i].up - products[i].up * products[i].discount / 100 : null,
                up: products[i].up,
                discount: products[i].discount,
                topPhoto: products[i].topPhoto ? products[i].topPhoto.url : null,
                producer: products[i].producer.name,
                category: products[i].category
            }
            for (let j = 0; j < categories.length; j++) {
                if (categories[j].name == newProduct.category) {
                    categories[j].products.push(newProduct)
                }
            }
        }

        categories.sort(function (a, b) {
            return a.rank - b.rank;
        })
        let lastList = []
        for (let p = 0; p < categories.length; p++) {
            if (categories[p].products.length > 0) {
                lastList.push(categories[p])
            }
        }
        return lastList
    },
};
