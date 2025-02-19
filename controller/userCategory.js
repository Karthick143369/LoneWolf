const productModel = require('../models/product')
const brandModel = require('../models/brand');
const categoryModel = require('../models/category');

// render the page containing all the products 
const categoryPage = async (req, res) => {
    try {
        const{page} = req.query;
        const currentPage =parseInt(page)
        const limit = 6;

        const skip = (page-1) *limit
        const category = await categoryModel.find();
        const brands = await brandModel.find();
        const products = await productModel.find({ isActive: true }).populate('brand').skip(skip).limit(limit);
        const totalProducts = await productModel.countDocuments();
        res.render('user/categoryPage', { 
            category, 
            brands, 
            products,
            currentPage,
            totalProducts,
           totalPages:Math.ceil(totalProducts/limit) 
        });

    } catch (error) {
        console.log('loading category page by user:', error.message);
    }
}


const productFilter = async (req, res) => {
    try {
        const { brand, category, priceRange, sort, search ,page} = req.query;
        console.log('sort":',sort)
        console.log('page',page)
        const currentPage =parseInt(page) || 1
        const limit = 6;
        const skip = (page-1)*limit;

        let filter = {};
        let sortOptions ={};

        if (brand !== 'undefined') {
            filter.brand = brand
        }
        if (category !== 'undefined') {
            filter.category = category
        }
        if (priceRange !== 'undefined') {
            const [minPrice, maxPrice] = priceRange.split('-').map(Number);
            console.log(minPrice, maxPrice)
            filter.price = { $gte: minPrice, $lte: maxPrice };
        }

        if(sort){
            switch(sort){
                case 'price-asc':
                    sortOptions.price = 1;
                    break;
                case 'price-desc':
                    sortOptions.price = -1;
                    break;
                case 'name-asc':
                    sortOptions.productName = 1;
                    break;
                case 'name-desc':
                    sortOptions.productName =-1;
                    break;
                default:
                    break;
            }
        }

        if (search && search !== 'undefined') {
            filter.productName = { $regex: '.*' + search +'.*', $options: 'i' };
        }

        const totalProducts = await productModel.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await productModel.find(filter).populate('brand category').sort(sortOptions).skip(skip).limit(limit)

        res.status(200).json({ products ,currentPage, totalPages})

    } catch (error) {
        console.log('error in filtering:', error.message);
        res.status(500).send('Server error');
    }
}

//searching products 
const searchProduct = async (req, res) => {
    try {
        const { brand, category, priceRange, sort, search } = req.query;
        let filter = {};
        let sortOptions ={};

        if (brand !== 'undefined') {
            filter.brand = brand
        }
        if (category !== 'undefined') {
            filter.category = category
        }
        if (priceRange && priceRange!== 'undefined') {
            const [minPrice, maxPrice] = priceRange.split('-').map(Number);
            console.log(minPrice, maxPrice)
            if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                filter.price = { $gte: minPrice, $lte: maxPrice };
            } else {
                return res.status(400).json({ error: 'Invalid price range format' });
            }
        }

        if (search && search !== 'undefined') {
            filter.productName = { $regex: '.*' + search + '.*', $options: 'i' };
        }


        if(sort){
            switch(sort){
                case 'price-asc':
                    sortOptions.price = 1;
                    break;
                case 'price-desc':
                    sortOptions.price = -1;
                    break;
                case 'name-asc':
                    sortOptions.productName =1;
                    break;
                case 'name-desc':
                    sortOptions.productName =-1;
                    break;
                default:
                    break;
            }
        }

        
        const products = await productModel.find(filter).sort(sortOptions)
        res.status(200).json({ products });

    } catch (error) {
        console.log('searching product error:', error.message);
        res.status(400).json({ error: 'Internal server Error' })
    }
}


module.exports = {
    categoryPage,
    productFilter,
    searchProduct

}