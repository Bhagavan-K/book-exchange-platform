import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/custom';
import Book, { IBook, BookStatus, BookCondition } from '../models/Book';
import User, { IUser } from '../models/User';

const ITEMS_PER_PAGE = 15;

export const INDIAN_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Bangalore', state: 'Karnataka' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Hyderabad', state: 'Telangana' }
];

type RequestWithUser = Request & { userId: string };

interface PopulatedBookDocument extends Omit<IBook, 'owner'> {
  owner: IUser;
}

interface PopulatedBookDocument extends Omit<IBook, 'owner'> {
  owner: IUser;
}

interface BookResponse {
  id: string;
  title: string;
  author: string;
  genre: string;
  condition: BookCondition;
  status: BookStatus;
  description?: string;
  owner: {
    id: string;
    name: string;
    email: string;
    preferences: {
      genres: string[];
    };
  };
  createdAt: Date;
}

const transformBookToResponse = (book: PopulatedBookDocument): BookResponse => {
  return {
    id: book._id.toString(),
    title: book.title,
    author: book.author,
    genre: book.genre,
    condition: book.condition,
    status: book.status,
    description: book.description,
    owner: {
      id: book.owner._id.toString(),
      name: book.owner.name,
      email: book.owner.email,
      preferences: book.owner.preferences
    },
    createdAt: book.createdAt
  };
};

export const getBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const searchQuery = req.query.search as string;
    const genreFilter = req.query.genre as string;
    const conditionFilter = req.query.condition as string;
    const locationFilter = req.query.location as string;
    const sortBy = req.query.sortBy as string;
    const userId = req.userId;

    // Get user preferences
    const currentUser = await User.findById(userId);
    const userGenres = currentUser?.preferences?.genres || [];

    let query = Book.find({ status: 'available' });

    // Apply filters
    if (searchQuery) {
      query = query.or([
        { title: new RegExp(searchQuery, 'i') },
        { author: new RegExp(searchQuery, 'i') }
      ]);
    }

    if (genreFilter && genreFilter !== 'All') {
      query = query.where('genre').equals(genreFilter);
    }

    if (conditionFilter && conditionFilter !== 'All') {
      query = query.where('condition').equals(conditionFilter);
    }

    if (locationFilter && locationFilter !== 'All') {
      query = query.where('location').equals(locationFilter);
    }

    // Get total count for pagination
    const totalBooks = await Book.countDocuments(query);

    // Add pagination and populate owner
    const books = await query
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate<{ owner: IUser }>('owner', 'name email preferences location')
      .lean();

    // Sort books
    const sortedBooks = [...books].sort((a, b) => {
      if (sortBy === 'recommended' && userGenres.length > 0) {
        const aScore = userGenres.includes(a.genre) ? 1 : 0;
        const bScore = userGenres.includes(b.genre) ? 1 : 0;
        return bScore - aScore;
      }

      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    // Transform and type assert the populated owner
    const transformedBooks = sortedBooks.map(book => {
      const populatedOwner = book.owner as IUser;
      return {
        id: book._id.toString(),
        title: book.title,
        author: book.author,
        genre: book.genre,
        condition: book.condition,
        status: book.status,
        description: book.description,
        location: book.location,
        owner: {
          id: populatedOwner._id.toString(),
          name: populatedOwner.name,
          email: populatedOwner.email,
          location: populatedOwner.location,
          preferences: populatedOwner.preferences || { genres: [] }
        },
        createdAt: book.createdAt
      };
    });

    res.json({
      data: {
        books: transformedBooks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBooks / ITEMS_PER_PAGE),
          totalItems: totalBooks,
          itemsPerPage: ITEMS_PER_PAGE
        }
      }
    });
  } catch (err) {
    console.error('Failed to fetch books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

export const getUserBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const books = await Book.find({ owner: new mongoose.Types.ObjectId(req.userId) })
      .populate<{ owner: IUser }>('owner', 'name email preferences')
      .sort({ createdAt: -1 });

    const transformedBooks = books.map(book => 
      transformBookToResponse(book as unknown as PopulatedBookDocument)
    );

    res.json({
      data: {
        books: transformedBooks
      }
    });
  } catch (err) {
    console.error('Failed to fetch user books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

export const createBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const book = new Book({
      ...req.body,
      owner: new mongoose.Types.ObjectId(req.userId)
    });

    await book.save();
    await book.populate<{ owner: IUser }>('owner', 'name email preferences location');

    const transformedBook = {
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      genre: book.genre,
      condition: book.condition,
      status: book.status,
      description: book.description,
      location: book.location,
      owner: {
        id: (book.owner as IUser)._id.toString(),
        name: (book.owner as IUser).name,
        email: (book.owner as IUser).email,
        location: (book.owner as IUser).location,
        preferences: (book.owner as IUser).preferences
      },
      createdAt: book.createdAt
    };

    res.status(201).json({
      message: 'Book created successfully',
      data: transformedBook
    });
  } catch (err) {
    console.error('Failed to create book:', err);
    res.status(500).json({ error: 'Failed to create book' });
  }
};

export const updateBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookId = req.params.id;
    const userId = new mongoose.Types.ObjectId(req.userId);
    const updateData = {
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      condition: req.body.condition,
      description: req.body.description,
      location: req.body.location
    };

    const existingBook = await Book.findById(bookId);
    if (!existingBook) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    if (existingBook.owner.toString() !== userId.toString()) {
      res.status(403).json({ error: 'Not authorized to update this book' });
      return;
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, owner: userId },
      updateData,
      { new: true }
    ).populate<{ owner: IUser }>('owner', 'name email preferences location');

    if (!updatedBook) {
      res.status(404).json({ error: 'Book not found after update' });
      return;
    }

    const transformedBook = {
      id: updatedBook._id.toString(),
      title: updatedBook.title,
      author: updatedBook.author,
      genre: updatedBook.genre,
      condition: updatedBook.condition,
      status: updatedBook.status,
      description: updatedBook.description,
      location: updatedBook.location,
      owner: {
        id: updatedBook.owner._id.toString(),
        name: updatedBook.owner.name,
        email: updatedBook.owner.email,
        location: updatedBook.owner.location,
        preferences: updatedBook.owner.preferences
      },
      createdAt: updatedBook.createdAt
    };

    res.json(transformedBook);
  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({ error: 'Failed to update book' });
  }
};

export const deleteBook = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId
    });
    
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
};