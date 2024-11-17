import { Response } from 'express';
import { AuthRequest } from '../types/custom';
import Transaction, { TransactionStatus, ITransaction } from '../models/Transaction';
import Book from '../models/Book';
import { Types } from 'mongoose';

// Create an exchange request
export const createExchangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookId, terms, message } = req.body;
    console.log('Creating exchange request:', { bookId, terms, message });

    const requesterId = new Types.ObjectId(req.userId);

    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    if (book.status !== 'available') {
      res.status(400).json({ error: 'Book is not available for exchange' });
      return;
    }

    if (book.owner.toString() === req.userId) {
      res.status(400).json({ error: 'Cannot request your own book' });
      return;
    }

    const transaction = new Transaction({
      book: new Types.ObjectId(bookId),
      requester: requesterId,
      owner: book.owner,
      terms,
      lastModifiedBy: requesterId,
      messages: message ? [{
        sender: requesterId,
        content: message,
        createdAt: new Date(),
        read: false
      }] : []
    });

    await transaction.save();

    // Update book status
    book.status = 'pending';
    await book.save();

    // Populate transaction details
    const populatedTransaction = await transaction
      .populate([
        { path: 'book', select: 'title author' },
        { path: 'requester', select: 'name email' },
        { path: 'owner', select: 'name email' },
        { path: 'messages.sender', select: 'name' }
      ]);

    // Send success response with populated data
    res.status(201).json({
      data: populatedTransaction
    });

    console.log('Exchange request created successfully:', populatedTransaction);
  } catch (err) {
    console.error('Create exchange request error:', err);
    res.status(500).json({ error: 'Failed to create exchange request' });
  }
};

// Update exchange request status
export const updateExchangeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { exchangeId } = req.params;
    const { status, message } = req.body;
    const userId = new Types.ObjectId(req.userId);

    console.log('Updating exchange status:', { exchangeId, status, message });

    // Validate exchangeId
    if (!Types.ObjectId.isValid(exchangeId)) {
      res.status(400).json({ error: 'Invalid exchange ID' });
      return;
    }

    const transaction = await Transaction.findById(exchangeId);
    if (!transaction) {
      res.status(404).json({ error: 'Exchange request not found' });
      return;
    }

    // Verify user authorization
    const isOwner = transaction.owner.toString() === userId.toString();
    const isRequester = transaction.requester.toString() === userId.toString();

    if (!isOwner && !isRequester) {
      res.status(403).json({ error: 'Not authorized to update this exchange' });
      return;
    }

    // Validate status update permissions
    if ((status === 'accepted' || status === 'rejected') && !isOwner) {
      res.status(403).json({ error: 'Only the owner can accept or reject requests' });
      return;
    }

    if (status === 'cancelled' && !isRequester) {
      res.status(403).json({ error: 'Only the requester can cancel requests' });
      return;
    }

    // Update transaction status
    transaction.status = status as TransactionStatus;
    transaction.lastModifiedBy = userId;

    // Add status change message
    const statusMessages = {
      accepted: 'Request accepted',
      rejected: 'Request rejected',
      cancelled: 'Request withdrawn'
    };

    const statusMessage = statusMessages[status as keyof typeof statusMessages] || '';
    
    if (statusMessage || message) {
      transaction.messages.push({
        sender: userId,
        content: message || statusMessage,
        createdAt: new Date(),
        read: false,
        notified: false
      });
    }

    // Update book status
    const book = await Book.findById(transaction.book);
    if (book) {
      book.status = status === 'accepted' ? 'pending' :
                    status === 'rejected' || status === 'cancelled' ? 'available' :
                    book.status;
      await book.save();
    }

    await transaction.save();

    // Populate and return updated transaction
    const populatedTransaction = await Transaction.findById(exchangeId)
      .populate([
        { path: 'book', select: 'title author genre condition status' },
        { path: 'requester', select: 'name email' },
        { path: 'owner', select: 'name email' },
        { path: 'messages.sender', select: 'name' }
      ]);

    if (!populatedTransaction) {
      res.status(404).json({ error: 'Exchange request not found after update' });
      return;
    }

    console.log('Exchange status updated successfully:', {
      id: populatedTransaction._id,
      status: populatedTransaction.status
    });

    res.json({
      message: 'Exchange status updated successfully',
      data: populatedTransaction
    });
  } catch (err) {
    console.error('Update exchange status error:', err);
    res.status(500).json({ error: 'Failed to update exchange status' });
  }
};

// Get user's exchange requests
export const getUserExchanges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const userId = new Types.ObjectId(req.userId);
    const statusFilter = status ? { status } : {};

    const exchanges = await Transaction.find({
      $or: [
        { requester: userId },
        { owner: userId }
      ],
      ...statusFilter
    })
    .populate([
      { path: 'book', select: 'title author genre condition status' },
      { path: 'requester', select: 'name email' },
      { path: 'owner', select: 'name email' },
      { path: 'lastModifiedBy', select: 'name' }
    ])
    .sort({ updatedAt: -1 });

    res.json({
      data: exchanges
    });
  } catch (err) {
    console.error('Get user exchanges error:', err);
    res.status(500).json({ error: 'Failed to fetch exchange requests' });
  }
};

// Get exchange details
export const getExchangeDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const userId = new Types.ObjectId(req.userId);

    const transaction = await Transaction.findById(transactionId)
      .populate([
        { path: 'book', select: 'title author genre condition status' },
        { path: 'requester', select: 'name email' },
        { path: 'owner', select: 'name email' },
        { path: 'messages.sender', select: 'name' },
        { path: 'lastModifiedBy', select: 'name' }
      ]);

    if (!transaction) {
      res.status(404).json({ error: 'Exchange request not found' });
      return;
    }

    if (![transaction.owner.toString(), transaction.requester.toString()].includes(req.userId)) {
      res.status(403).json({ error: 'Not authorized to view this exchange' });
      return;
    }

    const otherUser = transaction.owner.toString() === req.userId ? 
      transaction.requester.toString() : transaction.owner.toString();
    
    await Transaction.updateOne(
      { _id: transactionId, 'messages.sender': otherUser },
      { $set: { 'messages.$[elem].read': true } },
      { arrayFilters: [{ 'elem.sender': otherUser }] }
    );

    res.json({
      data: transaction
    });
  } catch (err) {
    console.error('Get exchange details error:', err);
    res.status(500).json({ error: 'Failed to fetch exchange details' });
  }
};

// Get unread notifications count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId);

    const unreadCount = await Transaction.countDocuments({
      $or: [
        { requester: userId },
        { owner: userId }
      ],
      'messages': {
        $elemMatch: {
          sender: { $ne: userId },
          read: false
        }
      }
    });

    res.json({
      data: { unreadCount }
    });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

export const getSentRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const exchanges = await Transaction.find({ requester: new Types.ObjectId(req.userId) })
      .populate([
        { path: 'book', select: 'title author genre condition status' },
        { path: 'owner', select: 'name email' },
        { path: 'messages.sender', select: 'name' }
      ])
      .sort({ createdAt: -1 });

    res.json({
      data: exchanges
    });
  } catch (err) {
    console.error('Get sent requests error:', err);
    res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
};

export const getReceivedRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const exchanges = await Transaction.find({ owner: new Types.ObjectId(req.userId) })
      .populate([
        { path: 'book', select: 'title author genre condition status' },
        { path: 'requester', select: 'name email' },
        { path: 'messages.sender', select: 'name' }
      ])
      .sort({ createdAt: -1 });

    res.json({
      data: exchanges
    });
  } catch (err) {
    console.error('Get received requests error:', err);
    res.status(500).json({ error: 'Failed to fetch received requests' });
  }
};
export const addMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { exchangeId } = req.params;
    const { message } = req.body;
    
    // Validate exchangeId
    if (!exchangeId || !Types.ObjectId.isValid(exchangeId)) {
      res.status(400).json({ error: 'Invalid exchange ID' });
      return;
    }

    const userId = new Types.ObjectId(req.userId);
    const transactionId = new Types.ObjectId(exchangeId);

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      res.status(404).json({ error: 'Exchange request not found' });
      return;
    }

    // Verify user is part of the exchange
    if (![transaction.owner.toString(), transaction.requester.toString()].includes(req.userId)) {
      res.status(403).json({ error: 'Not authorized to message in this exchange' });
      return;
    }

    // Add new message
    transaction.messages.push({
      sender: userId,
      content: message,
      createdAt: new Date(),
      read: false,
      notified: true
    });

    await transaction.save();

    // Populate the transaction with user details
    const populatedTransaction = await Transaction.findById(transactionId)
      .populate('book', 'title author genre condition status')
      .populate('requester', 'name email')
      .populate('owner', 'name email')
      .populate('messages.sender', 'name');

    if (!populatedTransaction) {
      res.status(404).json({ error: 'Exchange request not found after update' });
      return;
    }

    res.json({
      message: 'Message sent successfully',
      data: populatedTransaction
    });
  } catch (err) {
    console.error('Add message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};