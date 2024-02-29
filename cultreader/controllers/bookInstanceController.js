const BookInstance = require("../models/bookInstance");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await 
  BookInstance.find().populate("book").exec();
  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance =  await BookInstance.findById(req.params.id)
    .populate('book')
    .exec();
  if (bookInstance === null) {
    const err = new Error("No copy of such book is found")
    err.status = 404;
    return next(err);
  }
  res.render("bookinstance_detail", {
    title: "Book Instance",
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, 'title').sort({
    title: 1
  }).exec();

  res.render("bookinstance_form", {
    title: "Create Bookinstance",
    book_list: allBooks, 
    statusOptions: ['Maintenance', 'Available', 'Loaned', 'Reserved'],
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body('book', "Book must be specified").trim().isLength({
    min: 1
  }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ value: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const bookInstance =  new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });
    if (!errors.isEmpty()) {
      const allBooks = await BookInstance.find({}, 'title').sort({
        title: 1
      }).exec();
      res.render("bookinstance_form", {
        title: "Create Bookinstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
        await bookInstance.save();
        res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const [bookInstance, BookOfInstance] = await Promise.all([
    BookInstance.findById(req.params.id).exec(),
    Book.find({ bookInstance: req.params.id }, "title summary").exec(),
  ]);
  if (BookInstance === null ) {
    res.redirect("/catalog/bookinstances");
  } 

  res.render("bookinstance_delete", {
    title: "Delete Bookinstance",
    bookinstance: bookInstance,
    book: BookOfInstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  const [bookInstance, BookOfInstance] = await Promise.all([
    BookInstance.findById(req.params.id).exec(),
    Book.find({ bookInstance: req.params.id }, "title summary").exec(),
  ]);
  await BookInstance.findByIdAndDelete(req.body.bookinstanceid);
  res.redirect("/catalog/bookinstances");
  
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate('book').exec(),
    Book.find({}, 'title').sort({ title: 1 }).exec(),
  ]);
  if (bookInstance === null) {
    const err = new Error("Instance not found");
    err.status = 404;
    return next(err);
  }
  res.render("bookinstance_form", {
    title: "Update Insatance",
    bookinstance: bookInstance,
    book_list: allBooks,
    statusOptions: ['Maintenance', 'Available', 'Loaned', 'Reserved'],
  });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [(req, res, next) => {
  if (!Array.isArray(req.body.bookInstance)) {
    req.body.bookInstance = typeof req.body.genre === 'undefined' ? [] : 
    [req.body.bookInstance];
  }
  next();
  },
  body("book", "book must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "imprint must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status", "status must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("due_back", "due back must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),  
    
  asyncHandler(async (req, res, next) => {
    const errors =  validationResult(req);
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,   
    });
    if (!errors.isEmpty()) {
      const [bookInstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).populate('book').exec(),
        Book.find({}, 'title').sort({ title: 1 }).exec(),
      ]);
      res.render("bookinstance_form", {
        title: "Update Genre",
        bookinstance: bookInstance,
        book_list: allBooks,
        statusOptions: ['Maintenance', 'Available', 'Loaned', 'Reserved'],
        errors: errors.array(),
      });
      return;    
    } else {
      const updateBookInsatnce = await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
      res.redirect(updateBookInsatnce.url);
    }
  })     
];
