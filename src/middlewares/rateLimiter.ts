import rateLimit from 'express-rate-limit';

// Global API rate limiter middleware
// Adjust windowMs and max as needed. Current config:
//  - windowMs: 1000 ms (1 second)
//  - max: 10 requests per window per IP
export const apiLimiter = rateLimit({
  windowMs: 1000, // 1 second window
  max: 10,       // limit each IP to 10 requests per windowMs
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // disable the `X-RateLimit-*` headers
});
