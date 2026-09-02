import ApiError from "../utils/ApiError.js";

// Central error handler. Every route error (thrown ApiError or unexpected
// exception) flows here via asyncHandler's next(err) call.
//
// Without this, Express's default handler was returning an HTML error page
// (or an empty/unparseable body) instead of the {success, message} JSON the
// frontend expects — that's why errors were showing up as generic
// "Request failed" messages on the client.
const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors?.length ? { errors: err.errors } : {}),
        });
    }

    // Unexpected/unhandled error — never leak internal details to the client.
    console.error("Unhandled error:", err);
    return res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
    });
};

export { errorHandler };
