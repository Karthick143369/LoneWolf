const orderModel = require('../models/order');
const couponModel = require('../models/coupon');
const easyinvoice = require('easyinvoice');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { getEnabledCategories } = require('trace_events');

//dashboard
const dashboard = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayOrders = await orderModel.find({
            dateOrdered: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });
        
        // aggregation for top 10 best-selling products
        const topProducts = await orderModel.aggregate([
            { $unwind: "$productItems" },
            { $group: { _id: '$productItems.productId', totalSales: { $sum: '$productItems.quantity' } } },
            { $sort: { totalSales: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $project: {
                    _id: 1,
                    totalSales: 1,
                    productName: '$productDetails.productName'
                }
            }
        ])

        // aggregation for top 10 best-selling getEnabledCategories
        const topCategories = await orderModel.aggregate([
            { $unwind: '$productItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productItems.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            
            {
                $group: {
                    _id: '$productDetails.category',
                    totalSales: { $sum: '$productItems.quantity' }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $project: {
                    _id: 1,
                    totalSales: 1,
                    categoryName: '$categoryDetails.name'
                }
            }
        ])
       
      // Aggregation for top 10 best-selling brands
      const topBrands = await orderModel.aggregate([
        { $unwind: "$productItems" },
        { $lookup: {
            from: "products",
            localField: "productItems.productId",
            foreignField: "_id",
            as: "productDetails"
        }},
        { $unwind: "$productDetails" },
        { $group: { _id: "$productDetails.brand", totalSales: { $sum: "$productItems.quantity" } } },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
        { $lookup: {
            from: "brands",
            localField: "_id",
            foreignField: "_id",
            as: "brandDetails"
        }},
        { $unwind: "$brandDetails" },
        { $project: { _id: 1, totalSales: 1, brandName: "$brandDetails.name" } }
    ]);

    const categories = await orderModel.aggregate([
        { $unwind: '$productItems' },
        { $match : {dateOrdered: {$gte: startOfDay, $lte:endOfDay}}},
        {
            $lookup: {
                from: 'products',
                localField: 'productItems.productId',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        
        {
            $group: {
                _id: '$productDetails.category',
                totalSales: { $sum: '$productItems.quantity' }
            }
        },
        { $sort: { totalSales: -1 } },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryDetails'
            }
        },
        { $unwind: '$categoryDetails' },
        {
            $project: {
                _id: 1,
                totalSales: 1,
                categoryName: '$categoryDetails.name'
            }
        }
    ])

    const categoryLabels = categories.map(category => category.categoryName);
    const categorySales = categories.map(category => category.totalSales);
        res.render('admin/dashboard2', {
            orderData: JSON.stringify(todayOrders),
            topProducts,
            topCategories,
            topBrands,
            categoryLabels : JSON.stringify(categoryLabels),
            categorySales : JSON.stringify(categorySales),
        });
    } catch (error) {
        console.error('error while loading dashboard:', error);
        res.status(500).send('Server error');
    }
}

// updating chart based on the date selected
const chartUpdate = async (req, res) => {
    const { date, month, year } = req.query;

    try {
        let orders;
        if (date) {
            orders = await orderModel.find({
                dateOrdered: {
                    $gte: new Date(date),
                    $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
                }
            });
        } else if (month) {
            const startOfMonth = new Date(month);
            const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
            orders = await orderModel.find({
                dateOrdered: {
                    $gte: startOfMonth,
                    $lt: endOfMonth
                }
            });
        } else if (year) {
            const startOfYear = new Date(`${year}-01-01`);
            const endOfYear = new Date(`${year}-12-31`);
            orders = await orderModel.find({
                dateOrdered: {
                    $gte: startOfYear,
                    $lt: endOfYear
                }
            });
        } else {
            return res.status(400).json({ message: 'Invalid query parameters' });
        }

        const categories = await orderModel.aggregate([
            { $unwind: '$productItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productItems.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            
            {
                $group: {
                    _id: '$productDetails.category',
                    totalSales: { $sum: '$productItems.quantity' }
                }
            },
            { $sort: { totalSales: -1 } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $project: {
                    _id: 1,
                    totalSales: 1,
                    categoryName: '$categoryDetails.name'
                }
            }
        ])
    
        const categoryLabels = categories.map(category => category.categoryName);
        const categorySales = categories.map(category => category.totalSales);

        res.json({orders,categoryLabels,categorySales});
        // res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error });
    }
}


// SALES REPORT BASED ON PDFKIT AND EXCEL
const salesReport = async (req, res) => {
    try {
        const { interval, reportType } = req.query;
        let startDate, endDate;

        switch (interval) {
            case 'day':
                startDate = new Date(req.query.date);
                endDate = new Date(req.query.date);
                endDate.setDate(endDate.getDate() + 1); // Next day
                break;
            case 'week':
                startDate = new Date(req.query.date);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 7); // Next week
                break;
            case 'month':
                startDate = new Date(req.query.month);
                endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Last day of the month
                break;
            case 'year':
                startDate = new Date(req.query.year, 0, 1); // January 1st of the selected year
                endDate = new Date(req.query.year, 11, 31); // December 31st of the selected year
                break;
            case 'custom':
                startDate = new Date(req.query.startDate);
                endDate = new Date(req.query.endDate);
                break;
            default:
                return res.status(400).json({ error: 'Invalid interval type' });
        }

        const orders = await orderModel.find({
            dateOrdered: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('userId');

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No purchase found in this interval' });
        }

        if (reportType === 'pdf') {
            generatePDFReport(orders, startDate, endDate, interval, res);
        } else if (reportType === 'excel') {
            generateExcelReport(orders, startDate, endDate, interval, res);
        } else {
            res.status(400).json({ error: 'Invalid report type' });
        }
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const generatePDFReport = (orders, startDate, endDate, interval, res) => {
    const pdfDoc = new PDFDocument();
    const pdfPath = `sales_report_${interval}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfPath}"`);

    pdfDoc.pipe(res);

    pdfDoc.fontSize(12).text(`Sales Report - ${interval.toUpperCase()}`, { align: 'center' }).moveDown();
    pdfDoc.fontSize(10).text(`Orders from ${startDate.toDateString()} to ${endDate.toDateString()}`).moveDown();

    const totalSales = orders.reduce((total, order) => total + order.totalPrice, 0);
    const totalDiscount = orders.reduce((total, order) => total + order.couponDiscount, 0);

    pdfDoc.fontSize(10).text(`Total Amount: ${totalSales.toFixed(2)}`, { align: 'right' }).moveDown();

    const pageWidth = 540;
    const colWidthOrderID = pageWidth * 0.2;
    const colWidthDateOrdered = pageWidth * 0.2;
    const colWidthUserName = pageWidth * 0.1;
    const colWidthPaymentMethod = pageWidth * 0.1;
    const colWidthOriginalPrice = pageWidth * 0.1;
    const colWidthCouponDiscount = pageWidth * 0.1;
    const colWidthTotalPrice = pageWidth * 0.1;

    const posX = 50;
    const headerY = pdfDoc.y + 30;

    pdfDoc.fontSize(10).text('Order ID', posX, headerY);
    pdfDoc.text('Date', posX + colWidthOrderID, headerY);
    pdfDoc.text('Name', posX + colWidthOrderID + colWidthDateOrdered, headerY);
    pdfDoc.text('Payment ', posX + colWidthOrderID + colWidthDateOrdered + colWidthUserName, headerY);
    pdfDoc.text('Price', posX + colWidthOrderID + colWidthDateOrdered + colWidthUserName + colWidthPaymentMethod, headerY);
    pdfDoc.text('Discount', posX + colWidthOrderID + colWidthDateOrdered + colWidthUserName + colWidthPaymentMethod + colWidthOriginalPrice, headerY);
    pdfDoc.text('Total', posX + colWidthOrderID + colWidthDateOrdered + colWidthUserName + colWidthPaymentMethod + colWidthOriginalPrice + colWidthCouponDiscount, headerY);
    pdfDoc.moveDown();

    let posY = headerY + 20;
    const rowHeight = 20;
    pdfDoc.fontSize(8);
    orders.forEach((order, index) => {
        const rowY = posY + index * rowHeight;
        pdfDoc.text(order._id.toString(), posX, rowY);
        pdfDoc.text(order.dateOrdered.toDateString(), posX + colWidthOrderID, rowY);
        pdfDoc.text(order.userName, posX + colWidthOrderID + colWidthDateOrdered, rowY);
        pdfDoc.text(order.paymentMethod, posX + colWidthOrderID + colWidthDateOrdered + colWidthUserName, rowY);
        pdfDoc.text(order.originalPrice.toFixed(2), posX + colWidthOrderID + colWidthDateOrdered + colWidthUserName + colWidthPaymentMethod, rowY);
        // pdfDoc.text(order.couponDiscount.toFixed(2), posX + colWidthOrderID + colWidthDateOrdered + colWidthUserName + colWidthPaymentMethod + colWidthOriginalPrice, rowY);
        pdfDoc.text(order.totalPrice.toFixed(2), posX + colWidthOrderID + colWidthDateOrdered + colWidthUserName + colWidthPaymentMethod + colWidthOriginalPrice + colWidthCouponDiscount, rowY);
        pdfDoc.moveDown();
    });


    pdfDoc.fontSize(10).text(`Discount: ${totalDiscount.toFixed(2)}`, { align: 'right' }).moveDown();
    pdfDoc.fontSize(10).text(`Total Amount: ${totalSales.toFixed(2)}`, { align: 'right' }).moveDown();


    pdfDoc.end();
};


const generateExcelReport = (orders, startDate, endDate, interval, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 30 },
        { header: 'Date Ordered', key: 'dateOrdered', width: 15 },
        { header: 'User Name', key: 'userName', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        { header: 'Original Price', key: 'originalPrice', width: 20 },
        { header: 'Coupon Discount', key: 'couponDiscount', width: 20 },
        { header: 'Total Price', key: 'totalPrice', width: 20 }
    ];

    orders.forEach(order => {
        worksheet.addRow({
            orderId: order._id.toString(),
            dateOrdered: order.dateOrdered.toDateString(),
            userName: order.userName, // Assuming userId field has 'name'
            paymentMethod: order.paymentMethod,
            originalPrice: order.originalPrice.toFixed(2),
            // couponDiscount: order.couponDiscount.toFixed(2),
            totalPrice: order.totalPrice.toFixed(2)
        });
    });

    const totalDiscount = orders.reduce((total, order) => total + order.couponDiscount, 0);
    const totalSales = orders.reduce((total, order) => total + order.totalPrice, 0);


    worksheet.addRow({});
    worksheet.addRow({ totalPrice: `Total Amount: ${totalSales.toFixed(2)}` });
    worksheet.addRow({ couponDiscount: `Total Discount: ${totalDiscount.toFixed(2)}` });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sales_report_${interval}.XLSX"`);

    workbook.xlsx.write(res).then(() => {
        res.end();
    });
};

module.exports = {
    dashboard,
    chartUpdate,
    salesReport
}