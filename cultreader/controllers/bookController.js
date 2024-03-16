const Book = require("../models/book");
const Author = require("../models/author");
const Genre =  require("../models/genre");
const BookInstance = require("../models/bookInstance");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const author = require("../models/author");

exports.index = asyncHandler(async (req, res, next) => {
  const [
    numBooks,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
    numGenres,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: "Available" }).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
  ]);
  res.render("index", {
    title: "Readers' Cult",
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  })
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title author")
    .sort({title: 1})
    .populate("author")
    .exec();
  res.render("book_list", { title: 'Book List', book_list: allBooks });
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate('author').populate('genre').exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);
  if (book === null) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err); 
  }
  res.render(`book_detail`, {
    title: book.title,
    book: book,
    book_instances: bookInstances
  });
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  
  const [allAuthors, allGenres] = await Promise.all([
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ])

  res.render("book_form", {
    title: "Create Book",
    authors: allAuthors,
    genres: allGenres,
  });
});

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
    }
    next();
  },
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
  
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });
    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);
    for (const genre of allGenres) {
      if (book.genre.includes(genre._id)) {
        genre.checked = "true";
      }      
    }
    res.render("book_form", {
      title: "Create Book",
      authors: allAuthors,
      genres: allGenres,
      book: book,
      errors: errors.array(),
    });
    } else {
      await book.save();
      res.redirect(book.url);
    }
  })
]
// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const [book, allBookInstances] = await Promise.all([
    Book.findById(req.params.id).populate('author').populate('genre').exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);
  if (book === null) {
    res.redirect("/catalog/books");
  }
  res.render('book_delete', {
    title: "Delete Book",
    book: book,
    book_instances: allBookInstances,
  });
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  const [book, allBookInstances] = await Promise.all([
    Book.findById(req.params.id).populate('author').populate('genre').exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);
  if (allBookInstances.length > 0) {
    res.render("book_delete", {
      title: "Delete Book",
      book: book,
      book_instances: allBookInstances,
    });
  } else {
    await Book.findByIdAndDelete(req.body.bookid);
    res.redirect("/catalog/books");
  } 
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate("author").exec(),
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);

  if(book === null){
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }
  allGenres.forEach((genre) => {
    if(book.genre.includes(genre._id)) {
      genre.checked = "true";
    }
  });
  res.render("book_form", {
    title: 'Update Book',
    authors: allAuthors,
    genres: allGenres,
    book: book,
  });
});

// Handle book update on POST.
exports.book_update_post = [(req, res, next) => {
  if (!Array.isArray(req.body.genre)) {
    req.body.genre = typeof req.body.genre === "undefined" ? [] :
    [req.body.genre];
  }
  next();
  },

  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })  
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min:1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
  
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ])

      for (const genre of allGenres){
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
      return;
    } else {
      const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
      res.redirect(updatedBook.url);
    }
  })
]
