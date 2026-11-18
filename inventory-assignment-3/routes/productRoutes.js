const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const router = express.Router();
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validId = id => mongoose.Types.ObjectId.isValid(id);

// GET /api/products - filtering, sorting and pagination
router.get('/', asyncHandler(async (req, res) => {
  const { category, search, minPrice, maxPrice, sort = '-createdAt' } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const filter = {};
  if (category) filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    if (Object.values(filter.price).some(v => Number.isNaN(v))) return res.status(400).json({ message: 'minPrice and maxPrice must be numbers' });
  }
  const allowedSortFields = ['name', 'price', 'quantity', 'category', 'createdAt'];
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  if (!allowedSortFields.includes(sortField)) return res.status(400).json({ message: `Invalid sort field. Allowed: ${allowedSortFields.join(', ')}` });
  const sortOption = { [sortField]: sort.startsWith('-') ? -1 : 1 };
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter)
  ]);
  res.status(200).json({ total, page, totalPages: Math.ceil(total / limit), count: products.length, products });
}));

// GET /api/products/low-stock - must be before /:id
router.get('/low-stock', asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } }).sort({ quantity: 1 });
  res.status(200).json({ count: lowStockItems.length, lowStockItems });
}));

// GET /api/products/summary - category-wise aggregation
router.get('/summary', asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    { $group: { _id: '$category', totalItems: { $sum: 1 }, totalQuantity: { $sum: '$quantity' }, totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } }, avgPrice: { $avg: '$price' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 1, totalItems: 1, totalQuantity: 1, totalStockValue: { $round: ['$totalStockValue', 2] }, avgPrice: { $round: ['$avgPrice', 2] } } }
  ]);
  res.status(200).json({ categories: summary.length, summary });
}));

// POST /api/products - create product
router.post('/', asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
}));

// GET /api/products/:id - get one product
router.get('/:id', asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID' });
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.status(200).json(product);
}));

// PUT /api/products/:id - update product details
router.put('/:id', asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID' });
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.status(200).json(product);
}));

// PATCH /api/products/:id/stock - positive change = restock, negative = sale
router.patch('/:id/stock', asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID' });
  const change = Number(req.body.change);
  if (!Number.isInteger(change) || change === 0) return res.status(400).json({ message: 'change must be a non-zero integer (positive to restock, negative for sale)' });
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, ...(change < 0 ? { quantity: { $gte: Math.abs(change) } } : {}) },
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );
  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    return res.status(exists ? 400 : 404).json({ message: exists ? 'Insufficient stock for this sale' : 'Product not found' });
  }
  res.status(200).json({ message: 'Stock updated', product });
}));

// DELETE /api/products/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID' });
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.status(200).json({ message: 'Product deleted', id: product._id });
}));

module.exports = router;
